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
    } else {
        errorDiv.innerText = 'Password salah';
    }
}

// Simpan status pengguna ke status.json
function saveUserStatus() {
    showLoading('password');
    
    // Buat objek status baru
    const newStatus = {
        nomor: userPhone,
        status: true
    };
    
    console.log('Mencoba menyimpan status:', newStatus);
    console.log('Token:', CONFIG.GITHUB_TOKEN ? 'Token tersedia' : 'Token tidak tersedia');
    
    // Implementasi nyata dengan GitHub API:
    fetch(CONFIG.GITHUB_STATUS_URL, {
        headers: {
            'Authorization': `token ${CONFIG.GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json'
        }
    })
        .then(response => {
            console.log('Response status:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Data dari GitHub:', data);
            
            // Parse existing data
            let statusData = [];
            try {
                if (data.content) {
                    statusData = JSON.parse(atob(data.content));
                }
            } catch (e) {
                console.log('File status.json kosong atau tidak valid, membuat array baru');
                statusData = [];
            }
            
            console.log('Data sebelum ditambah:', statusData);
            
            // Tambahkan status baru
            statusData.push(newStatus);
            
            console.log('Data setelah ditambah:', statusData);
            
            // Encode kembali ke base64
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
            console.log('Response update:', response);
            if (response.ok) {
                return response.json();
            } else {
                return response.json().then(err => {
                    throw new Error(`Gagal update: ${JSON.stringify(err)}`);
                });
            }
        })
        .then(result => {
            console.log('Update berhasil:', result);
            hideLoading('password');
            showSection('success-section');
            playSuccessSound();
        })
        .catch(error => {
            console.error('Error detail:', error);
            hideLoading('password');
            document.getElementById('password-error').innerHTML = `
                Gagal menyimpan data.<br>
                Error: ${error.message}<br>
                Silakan cek console untuk detail lebih lanjut.
            `;
        });
}

// Putar suara sukses
function playSuccessSound() {
    if (audioElement) {
        audioElement.play().catch(e => {
            console.log('Audio play failed:', e);
            // Fallback jika autoplay diblokir
            document.body.addEventListener('click', function playOnce() {
                audioElement.play().catch(e => console.log('Audio play failed on click:', e));
                document.body.removeEventListener('click', playOnce);
            }, { once: true });
        });
    }
}
