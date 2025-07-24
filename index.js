// index.js
let validUsers = [];
let currentUser = null;
let userPhone = null;
let audioElement = null;

// Inisialisasi saat halaman dimuat
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    
    // Tambahkan event listener untuk Enter key
    document.getElementById('phone').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') checkPhone();
    });
    
    document.getElementById('username').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') checkUsername();
    });
    
    document.getElementById('password').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') checkPassword();
    });
});

// Inisialisasi aplikasi
function initializeApp() {
    loadUserData();
    setupBackground();
    setupAudio();
    playSuccessSound(); // Audio langsung play
}

// Setup background image
function setupBackground() {
    if (CONFIG.BACKGROUND_IMAGE) {
        document.getElementById('background-body').style.backgroundImage = `url('${CONFIG.BACKGROUND_IMAGE}')`;
    }
}

// Setup audio element
function setupAudio() {
    if (CONFIG.SUCCESS_AUDIO) {
        const audio = document.getElementById('success-audio');
        audio.src = CONFIG.SUCCESS_AUDIO;
        audioElement = audio;
        audio.loop = false;
    }
}

// Putar suara sukses langsung (otomatis saat load)
function playSuccessSound() {
    if (audioElement) {
        // Coba autoplay langsung
        const playPromise = audioElement.play();
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    console.log('Audio autoplay berhasil');
                })
                .catch(error => {
                    console.log('Autoplay diblokir:', error);
                    // Fallback: play saat ada interaksi pertama
                    const playAudioOnClick = () => {
                        audioElement.play().catch(e => console.log('Play on click failed:', e));
                        document.removeEventListener('click', playAudioOnClick);
                        document.removeEventListener('touchstart', playAudioOnClick);
                    };
                    document.addEventListener('click', playAudioOnClick);
                    document.addEventListener('touchstart', playAudioOnClick);
                });
        }
    }
}

// Load data pengguna dari GitHub
function loadUserData() {
    showLoading('phone');
    
    fetch(CONFIG.GITHUB_DATA_URL)
        .then(response => {
            if (!response.ok) {
                throw new Error('Gagal memuat data');
            }
            return response.json();
        })
        .then(data => {
            validUsers = data;
            hideLoading('phone');
        })
        .catch(error => {
            console.error('Error:', error);
            hideLoading('phone');
            document.getElementById('phone-error').innerText = 'Gagal memuat data pengguna. Silakan coba lagi.';
        });
}

// Fungsi untuk menampilkan loading
function showLoading(section) {
    document.getElementById(`${section}-loading`).style.display = 'block';
}

// Fungsi untuk menyembunyikan loading
function hideLoading(section) {
    document.getElementById(`${section}-loading`).style.display = 'none';
}

// Fungsi untuk menampilkan section tertentu
function showSection(sectionId) {
    // Sembunyikan semua section
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Tampilkan section yang diminta
    document.getElementById(sectionId).classList.add('active');
    
    // Clear errors
    document.querySelectorAll('.error').forEach(el => el.innerText = '');
}

// Validasi Nomor Telepon
function checkPhone() {
    const phone = document.getElementById('phone').value.trim();
    const errorDiv = document.getElementById('phone-error');
    
    errorDiv.innerText = '';
    
    if (!phone) {
        errorDiv.innerText = 'Nomor telepon tidak boleh kosong';
        return;
    }
    
    if (!validUsers.length) {
        errorDiv.innerText = 'Data pengguna belum dimuat. Silakan coba lagi.';
        loadUserData();
        return;
    }
    
    const user = validUsers.find(u => u.nomor === phone);
    
    if (user) {
        currentUser = user;
        userPhone = phone;
        showSection('username-section');
    } else {
        errorDiv.innerText = 'Nomor telepon tidak terdaftar';
    }
}

// Validasi Username
function checkUsername() {
    const username = document.getElementById('username').value.trim();
    const errorDiv = document.getElementById('username-error');
    
    errorDiv.innerText = '';
    
    if (!username) {
        errorDiv.innerText = 'Username tidak boleh kosong';
        return;
    }
    
    if (currentUser && currentUser.username === username) {
        showSection('password-section');
    } else {
        errorDiv.innerText = 'Username tidak sesuai dengan nomor telepon';
    }
}

// Validasi Password dan simpan status
function checkPassword() {
    const password = document.getElementById('password').value.trim();
    const errorDiv = document.getElementById('password-error');
    
    errorDiv.innerText = '';
    
    if (!password) {
        errorDiv.innerText = 'Password tidak boleh kosong';
        return;
    }
    
    if (currentUser && currentUser.password === password) {
        saveUserStatus();
        // Tampilkan sukses langsung tanpa menunggu penyimpanan
        showSection('success-section');
    } else {
        errorDiv.innerText = 'Password salah';
    }
}

// Simpan status pengguna ke status.json
function saveUserStatus() {
    // Audio langsung play saat password benar
    playSuccessSound();
    
    // Jika token tidak disediakan, hentikan proses
    if (!CONFIG.GITHUB_TOKEN) {
        console.log('Token GitHub tidak disediakan, melewatkan penyimpanan ke GitHub');
        return;
    }
    
    // Buat objek status baru
    const newStatus = {
        nomor: userPhone,
        status: true
    };
    
    // Implementasi dengan GitHub API
    fetch(CONFIG.GITHUB_STATUS_URL, {
        headers: {
            'Authorization': `token ${CONFIG.GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json'
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // Parse existing data
            let statusData = [];
            try {
                if (data.content) {
                    statusData = JSON.parse(atob(data.content));
                }
            } catch (e) {
                statusData = [];
            }
            
            // Tambahkan status baru
            statusData.push(newStatus);
            
            // Encode ke base64
            const updatedContent = btoa(unescape(encodeURIComponent(JSON.stringify(statusData, null, 2))));
            
            // Update file di GitHub
            return fetch(CONFIG.GITHUB_STATUS_URL, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${CONFIG.GITHUB_TOKEN}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/vnd.github.v3+json'
                },
                body: JSON.stringify({
                    message: `Add status for ${userPhone}`,
                    content: updatedContent,
                    sha: data.sha
                })
            });
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Gagal update file: ${response.status}`);
            }
            console.log('Status berhasil disimpan ke GitHub');
        })
        .catch(error => {
            console.error('Error menyimpan ke GitHub:', error);
        });
}
