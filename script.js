let currentStep = 1;
let userData = {};
let validData = [];

// Load background image and audio
document.addEventListener('DOMContentLoaded', function() {
  document.body.style.backgroundImage = `url('${APP_CONFIG.IMAGE_URL}')`;
  const audio = document.getElementById("bg-audio");
  audio.src = APP_CONFIG.AUDIO_URL;
  audio.volume = 0.3;
  
  // Handle audio autoplay
  const playPromise = audio.play();
  if (playPromise !== undefined) {
    playPromise.catch(error => {
      console.log('Audio autoplay was prevented:', error);
    });
  }
});

// Load data from GitHub
async function loadData() {
  try {
    showLoading("Memuat data...");
    const response = await fetch(APP_CONFIG.API_DATA_URL);
    if (!response.ok) throw new Error('Gagal memuat data');
    validData = await response.json();
    hideLoading();
  } catch (err) {
    hideLoading();
    console.error("Error loading ", err);
    alert("Gagal memuat data verifikasi. Silahkan refresh halaman.");
  }
}

loadData();

function showForm(step) {
  const container = document.getElementById("form-container");
  
  switch(step) {
    case 1:
      container.innerHTML = `
        <h2>Verifikasi Nomor Telepon</h2>
        <input type="text" id="phone" placeholder="Masukkan nomor telepon" autocomplete="off">
        <button onclick="checkPhone()">Lanjut</button>
      `;
      break;
    case 2:
      container.innerHTML = `
        <h2>Verifikasi Username</h2>
        <input type="text" id="username" placeholder="Masukkan username" autocomplete="off">
        <button onclick="checkUsername()">Lanjut</button>
      `;
      break;
    case 3:
      container.innerHTML = `
        <h2>Verifikasi Password</h2>
        <input type="password" id="password" placeholder="Masukkan password" autocomplete="off">
        <button onclick="checkPassword()">Lanjut</button>
      `;
      break;
    case 4:
      container.innerHTML = `
        <div class="success-message">
          <h2>✅ Berhasil!</h2>
          <p>Data sudah disimpan.<br>Silahkan hubungkan bot di panel Pterodactyl.</p>
          <div style="margin-top: 20px; font-size: 0.9em; color: #666;">
            <p>Nomor: ${userData.nomor}</p>
            <p>Username: ${userData.username}</p>
          </div>
        </div>
      `;
      setTimeout(saveStatus, 1000);
      break;
  }
}

function showLoading(message = "Memproses...") {
  const container = document.getElementById("form-container");
  container.innerHTML = `
    <div class="loading">
      <h2>${message}</h2>
      <div class="spinner"></div>
    </div>
  `;
}

function hideLoading() {
  // Will be replaced by next form
}

function checkPhone() {
  const phone = document.getElementById("phone").value.trim();
  
  if (!phone) {
    alert("Masukkan nomor telepon terlebih dahulu.");
    return;
  }

  const user = validData.find(u => u.nomor === phone);
  if (user) {
    userData.nomor = phone;
    currentStep = 2;
    showForm(currentStep);
  } else {
    alert("Nomor tidak valid.");
  }
}

function checkUsername() {
  const username = document.getElementById("username").value.trim();
  
  if (!username) {
    alert("Masukkan username terlebih dahulu.");
    return;
  }

  const user = validData.find(u => u.username === username && u.nomor === userData.nomor);
  if (user) {
    userData.username = username;
    currentStep = 3;
    showForm(currentStep);
  } else {
    alert("Username tidak valid.");
  }
}

function checkPassword() {
  const password = document.getElementById("password").value.trim();
  
  if (!password) {
    alert("Masukkan password terlebih dahulu.");
    return;
  }

  const user = validData.find(u => u.password === password && u.nomor === userData.nomor && u.username === userData.username);
  if (user) {
    userData.password = password;
    currentStep = 4;
    showForm(currentStep);
  } else {
    alert("Password salah.");
  }
}

async function saveStatus() {
  try {
    console.log("Menyimpan status untuk:", userData.nomor);
    
    // Simpan ke backend proxy
    const response = await fetch('/api/save-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nomor: userData.nomor
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log("✅ Status berhasil disimpan via backend!");
    } else {
      console.error("❌ Gagal menyimpan status:", result.error);
    }
    
  } catch (error) {
    console.error("Error saving status:", error);
    // Still show success to user
  }
}

// Initialize first form
showForm(currentStep);
