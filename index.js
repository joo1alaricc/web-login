
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
    
    // Untuk demo purposes, langsung tampilkan sukses
    // Karena GitHub API membutuhkan autentikasi untuk write operations
    setTimeout(() => {
        hideLoading('password');
        showSection('success-section');
        playSuccessSound();
    }, 1500);
    
    // Implementasi nyata dengan GitHub API:
    /*
    fetch(CONFIG.GITHUB_STATUS_URL)
        .then(response => response.json())
        .then(data => {
            // Parse existing data (decode base64)
            let statusData = JSON.parse(atob(data.content));
            
            // Tambahkan status baru
            statusData.push(newStatus);
            
            // Encode kembali ke base64
            const updatedContent = btoa(JSON.stringify(statusData, null, 2));
            
            // Update file di GitHub
            return fetch(CONFIG.GITHUB_STATUS_URL, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${CONFIG.GITHUB_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: `Add status for ${userPhone}`,
                    content: updatedContent,
                    sha: data.sha
                })
            });
        })
        .then(response => {
            if (response.ok) {
                hideLoading('password');
                showSection('success-section');
                playSuccessSound();
            } else {
                throw new Error('Gagal menyimpan status');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            hideLoading('password');
            document.getElementById('password-error').innerText = 'Gagal menyimpan data. Silakan coba lagi.';
        });
    */
}

// Putar suara sukses
function playSuccessSound() {
    if (audioElement) {
        audioElement.play().catch(e => console.log('Audio play failed:', e));
    }
}
