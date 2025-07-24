
let validUsers = [];
let currentUser = null;
let userPhone = null;
let audioElement = null;

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    
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

function initializeApp() {
    loadUserData();
    setupBackground();
    setupAudio();
}

function setupBackground() {
    if (CONFIG.BACKGROUND_IMAGE) {
        document.getElementById('background-body').style.backgroundImage = `url('${CONFIG.BACKGROUND_IMAGE}')`;
    }
}

function setupAudio() {
    if (CONFIG.SUCCESS_AUDIO) {
        const audio = document.getElementById('success-audio');
        audio.src = CONFIG.SUCCESS_AUDIO;
        audioElement = audio;
    }
}

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

function showLoading(section) {
    document.getElementById(`${section}-loading`).style.display = 'block';
}

function hideLoading(section) {
    document.getElementById(`${section}-loading`).style.display = 'none';
}

function showSection(sectionId) {
    
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    
    document.getElementById(sectionId).classList.add('active');
    

    document.querySelectorAll('.error').forEach(el => el.innerText = '');
}


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

function saveUserStatus() {
    showLoading('password');
    

    const newStatus = {
        nomor: userPhone,
        status: true
    };
    

    setTimeout(() => {
        hideLoading('password');
        showSection('success-section');
        playSuccessSound();
    }, 1500);
    
    
    fetch(CONFIG.GITHUB_STATUS_URL)
        .then(response => response.json())
        .then(data => {
            /
            let statusData = JSON.parse(atob(data.content));
            
            
            statusData.push(newStatus);
            
            
            const updatedContent = btoa(JSON.stringify(statusData, null, 2));
            
            
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
    
}


function playSuccessSound() {
    if (audioElement) {
        audioElement.play().catch(e => console.log('Audio play failed:', e));
    }
}
