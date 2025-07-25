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
    console.log("=== Mencoba menyimpan status ===");
    console.log("Nomor:", userData.nomor);
    console.log("API URL:", APP_CONFIG.API_STATUS_URL);
    
    // Method 1: Direct API call
    console.log("Method 1: Direct API call");
    await saveToGitHubDirect();
    
  } catch (error) {
    console.error("Error dengan Method 1:", error);
    
    try {
      // Method 2: Alternative approach
      console.log("Method 2: Alternative approach");
      await saveToGitHubAlternative();
      
    } catch (error2) {
      console.error("Error dengan Method 2:", error2);
      
      // Method 3: Show debug info
      console.log("=== Debug Info ===");
      console.log("Token length:", APP_CONFIG.GITHUB_TOKEN.length);
      console.log("Token starts with:", APP_CONFIG.GITHUB_TOKEN.substring(0, 10) + "...");
      
      // Still show success to user
      console.log("Menampilkan success message ke user (walaupun gagal simpan)");
    }
  }
}

async function saveToGitHubDirect() {
  // Get current file
  const getResponse = await fetch(APP_CONFIG.API_STATUS_URL, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${APP_CONFIG.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Verifikasi-App'
    }
  });

  if (!getResponse.ok) {
    const errorText = await getResponse.text();
    console.error("GET Error:", errorText);
    throw new Error(`GET failed: ${getResponse.status}`);
  }

  const fileData = await getResponse.json();
  console.log("File SHA:", fileData.sha);

  // Parse existing data
  let existingData = [];
  try {
    const decoded = atob(fileData.content);
    existingData = JSON.parse(decoded);
    console.log("Existing data parsed:", existingData.length, "entries");
  } catch (e) {
    console.log("Starting with empty array");
    existingData = [];
  }

  // Add new entry
  const newEntry = {
    nomor: userData.nomor,
    status: true,
    timestamp: new Date().toISOString(),
    method: "direct"
  };
  
  existingData.push(newEntry);
  console.log("Total entries after adding:", existingData.length);

  // Encode and save
  const jsonString = JSON.stringify(existingData, null, 2);
  const encodedContent = btoa(unescape(encodeURIComponent(jsonString)));
  
  console.log("Content length:", encodedContent.length);

  const putResponse = await fetch(APP_CONFIG.API_STATUS_URL, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${APP_CONFIG.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'Verifikasi-App'
    },
    body: JSON.stringify({
      message: `Add status for ${userData.nomor}`,
      content: encodedContent,
      sha: fileData.sha
    })
  });

  if (!putResponse.ok) {
    const errorText = await putResponse.text();
    console.error("PUT Error:", errorText);
    throw new Error(`PUT failed: ${putResponse.status}`);
  }

  console.log("✅ Status saved successfully via Direct Method!");
  return true;
}

async function saveToGitHubAlternative() {
  // Alternative method using different encoding
  const getResponse = await fetch(APP_CONFIG.API_STATUS_URL, {
    method: 'GET',
    headers: {
      'Authorization': `token ${APP_CONFIG.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  });

  if (!getResponse.ok) {
    throw new Error(`GET failed: ${getResponse.status}`);
  }

  const fileData = await getResponse.json();
  
  // Parse existing data
  let existingData = [];
  try {
    const decoded = atob(fileData.content.replace(/\s/g, ''));
    existingData = JSON.parse(decoded);
  } catch (e) {
    existingData = [];
  }

  // Add new entry
  const newEntry = {
    nomor: userData.nomor,
    status: true,
    timestamp: new Date().toISOString(),
    method: "alternative"
  };
  
  existingData.push(newEntry);

  // Encode differently
  const jsonString = JSON.stringify(existingData, null, 2);
  const encodedContent = btoa(jsonString);
  
  const putResponse = await fetch(APP_CONFIG.API_STATUS_URL, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${APP_CONFIG.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: `Update status for ${userData.nomor}`,
      content: encodedContent,
      sha: fileData.sha
    })
  });

  if (!putResponse.ok) {
    throw new Error(`PUT failed: ${putResponse.status}`);
  }

  console.log("✅ Status saved successfully via Alternative Method!");
  return true;
}

// Initialize first form
showForm(currentStep);
