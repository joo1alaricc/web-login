// config.js
if (typeof CONFIG === 'undefined') {
    const CONFIG = {
        GITHUB_DATA_URL: 'https://raw.githubusercontent.com/joo1alaricc/dimasnathan/main/erlic.json',
        GITHUB_STATUS_URL: 'https://api.github.com/repos/joo1alaricc/dimasnathan/contents/status.json',
        GITHUB_TOKEN: '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', // Isi dengan token GitHub Anda
        BACKGROUND_IMAGE: '', // Isi dengan URL gambar latar belakang
        SUCCESS_AUDIO: '' // Isi dengan URL audio sukses
    };
    
    // Make CONFIG globally available
    window.CONFIG = CONFIG;
}
