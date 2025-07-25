# Verifikasi Data Web Application

Aplikasi web sederhana untuk verifikasi data pengguna dengan 3 tahap:
1. Nomor Telepon
2. Username  
3. Password

## Fitur
- Verifikasi 3 tahap
- Audio autoplay
- Background image
- Penyimpanan data ke GitHub
- Responsive design
- Animasi halus

## Cara Deploy

### Netlify
1. Upload semua file ke Netlify
2. Set build command: (kosong)
3. Publish directory: /

### Vercel
1. Import project ke Vercel
2. Framework Preset: Other
3. Build Command: (kosong)
4. Output Directory: ./

### GitHub Pages
1. Buat repository baru
2. Upload semua file
3. Enable GitHub Pages di Settings

### Surge.sh
1. Install surge: `npm install -g surge`
2. Deploy: `surge .`

## Konfigurasi
Edit file `config.js` untuk mengubah:
- API URLs
- Media URLs
- GitHub Token

## Catatan Keamanan
⚠️ Token GitHub terlihat di client-side. Untuk produksi, gunakan backend proxy.

## Lisensi
MIT License
