// Main application script
class VerifikasiApp {
  constructor() {
    this.currentStep = 1;
    this.userData = {};
    this.validData = [];
    this.isLoading = false;
    
    this.init();
  }
  
  async init() {
    this.loadMedia();
    await this.loadData();
    this.showForm(this.currentStep);
  }
  
  loadMedia() {
    // Load background image
    document.body.style.backgroundImage = `url('${APP_CONFIG.IMAGE_URL}')`;
    
    // Load audio
    const audioElement = document.getElementById("bg-audio");
    audioElement.src = APP_CONFIG.AUDIO_URL;
    
    // Handle audio autoplay policies
    audioElement.addEventListener('canplay', () => {
      audioElement.play().catch(e => console.log('Audio autoplay prevented:', e));
    });
  }
  
  async loadData() {
    try {
      this.showLoading("Memuat data...");
      const response = await fetch(APP_CONFIG.API_DATA_URL);
      if (!response.ok) throw new Error('Gagal memuat data');
      this.validData = await response.json();
      this.hideLoading();
    } catch (err) {
      this.hideLoading();
      console.error("Error loading data:", err);
      this.showError("Gagal memuat data verifikasi. Silahkan refresh halaman.");
    }
  }
  
  showForm(step) {
    const container = document.getElementById("form-container");
    
    switch(step) {
      case 1:
        container.innerHTML = `
          <h2>Verifikasi Nomor Telepon</h2>
          <input type="text" id="phone" placeholder="Masukkan nomor telepon" autocomplete="off">
          <button onclick="app.checkPhone()">Lanjut</button>
        `;
        break;
      case 2:
        container.innerHTML = `
          <h2>Verifikasi Username</h2>
          <input type="text" id="username" placeholder="Masukkan username" autocomplete="off">
          <button onclick="app.checkUsername()">Lanjut</button>
        `;
        break;
      case 3:
        container.innerHTML = `
          <h2>Verifikasi Password</h2>
          <input type="password" id="password" placeholder="Masukkan password" autocomplete="off">
          <button onclick="app.checkPassword()">Lanjut</button>
        `;
        break;
      case 4:
        container.innerHTML = `
          <div class="success-message">
            <h2>✅ Berhasil!</h2>
            <p>Data sudah disimpan.<br>Silahkan hubungkan bot di panel Pterodactyl.</p>
          </div>
        `;
        this.saveStatus();
        break;
    }
  }
  
  showLoading(message = "Memproses...") {
    const container = document.getElementById("form-container");
    container.innerHTML = `
      <div class="loading">
        <h2>${message}</h2>
        <div class="spinner"></div>
      </div>
    `;
  }
  
  hideLoading() {
    // Will be replaced by next form
  }
  
  showError(message) {
    alert(message);
  }
  
  checkPhone() {
    const phone = document.getElementById("phone").value.trim();
    
    if (!phone) {
      this.showError("Masukkan nomor telepon terlebih dahulu.");
      return;
    }
    
    const user = this.validData.find(u => u.nomor === phone);
    if (user) {
      this.userData.nomor = phone;
      this.currentStep = 2;
      this.showForm(this.currentStep);
    } else {
      this.showError("Nomor tidak valid.");
    }
  }
  
  checkUsername() {
    const username = document.getElementById("username").value.trim();
    
    if (!username) {
      this.showError("Masukkan username terlebih dahulu.");
      return;
    }
    
    const user = this.validData.find(u => u.username === username && u.nomor === this.userData.nomor);
    if (user) {
      this.userData.username = username;
      this.currentStep = 3;
      this.showForm(this.currentStep);
    } else {
      this.showError("Username tidak valid.");
    }
  }
  
  checkPassword() {
    const password = document.getElementById("password").value.trim();
    
    if (!password) {
      this.showError("Masukkan password terlebih dahulu.");
      return;
    }
    
    const user = this.validData.find(u => 
      u.password === password && 
      u.nomor === this.userData.nomor && 
      u.username === this.userData.username
    );
    
    if (user) {
      this.userData.password = password;
      this.currentStep = 4;
      this.showForm(this.currentStep);
    } else {
      this.showError("Password salah.");
    }
  }
  
  async saveStatus() {
    try {
      // Get current status data
      const response = await fetch(APP_CONFIG.API_STATUS_URL, {
        headers: {
          'Authorization': `Bearer ${APP_CONFIG.GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': `${APP_CONFIG.APP_NAME}/${APP_CONFIG.VERSION}`
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("GitHub API Error:", errorText);
        throw new Error(`Gagal mengambil data status: ${response.status}`);
      }
      
      const file = await response.json();
      
      // Parse current content
      let statusData = [];
      if (file.content && file.encoding === 'base64') {
        try {
          const decodedContent = atob(file.content);
          statusData = JSON.parse(decodedContent);
        } catch (parseError) {
          console.warn("Failed to parse existing content, starting fresh:", parseError);
          statusData = [];
        }
      }
      
      // Add new data
      const newData = { 
        nomor: this.userData.nomor, 
        status: true,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      };
      
      statusData.push(newData);
      
      // Update file
      const updatedContent = JSON.stringify(statusData, null, 2);
      const encodedContent = btoa(updatedContent);
      
      const updateResponse = await fetch(APP_CONFIG.API_STATUS_URL, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${APP_CONFIG.GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': `${APP_CONFIG.APP_NAME}/${APP_CONFIG.VERSION}`
        },
        body: JSON.stringify({
          message: `Add status for ${this.userData.nomor}`,
          content: encodedContent,
          sha: file.sha
        })
      });
      
      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        console.error("GitHub Update Error:", errorText);
        throw new Error(`Gagal menyimpan status: ${updateResponse.status}`);
      }
      
      console.log("Status berhasil disimpan ke GitHub!");
      
    } catch (err) {
      console.error("Error saving status:", err);
      // Still show success message to user even if saving fails
    }
  }
}

// Initialize app when DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', function() {
  app = new VerifikasiApp();
});

// Make app globally accessible for inline event handlers
window.app = app || {};
