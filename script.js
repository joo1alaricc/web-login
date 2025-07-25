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
    console.error("Error loading data:", err);
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
    
    // Get current file data
    const response = await fetch(APP_CONFIG.API_STATUS_URL, {
      method: 'GET',
      headers: {
        'Authorization': `token ${APP_CONFIG.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Get file error:", errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const fileData = await response.json();
    console.log("File data received");

    // Parse existing content
    let existingData = [];
    try {
      const decodedContent = atob(fileData.content);
      existingData = JSON.parse(decodedContent);
      console.log("Existing data parsed:", existingData);
    } catch (e) {
      console.log("No existing data or parse error");
      existingData = [];
    }

    // Add new entry
    const newEntry = {
      nomor: userData.nomor,
      status: true,
      timestamp: new Date().toISOString()
    };
    
    existingData.push(newEntry);
    console.log("New data to save:", existingData);

    // Encode content
    const newContent = JSON.stringify(existingData, null, 2);
    const encodedContent = btoa(unescape(encodeURIComponent(newContent)));
    console.log("Encoded content length:", encodedContent.length);

    // Update file
    const updateResponse = await fetch(APP_CONFIG.API_STATUS_URL, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${APP_CONFIG.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `Add status for ${userData.nomor} - ${new Date().toLocaleString('id-ID')}`,
        content: encodedContent,
        sha: fileData.sha
      })
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error("Update failed:", errorText);
      throw new Error(`Update failed: ${updateResponse.status}`);
    }

    console.log("Status successfully saved to GitHub!");
    
  } catch (error) {
    console.error("Error saving status to GitHub:", error);
    // Still show success to user
  }
}

// Initialize first form
showForm(currentStep);
