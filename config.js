// Configuration for the web application
const APP_CONFIG = {
  // GitHub API URLs
  API_DATA_URL: "https://raw.githubusercontent.com/joo1alaricc/dimasnathan/main/erlic.json",
  API_STATUS_URL: "https://api.github.com/repos/joo1alaricc/dimasnathan/contents/status.json",
  
  // GitHub Token (for testing only - in production, use backend)
  GITHUB_TOKEN: "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",
  
  // Media URLs
  AUDIO_URL: "https://files.catbox.moe/my4nqf.mp3",
  IMAGE_URL: "https://files.catbox.moe/snga5o.jpeg",
  
  // App Settings
  APP_NAME: "Verifikasi Data",
  VERSION: "1.0.0"
};

// Make config available globally
window.APP_CONFIG = APP_CONFIG;
