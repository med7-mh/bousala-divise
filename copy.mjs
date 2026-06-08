import fs from 'fs';
if (!fs.existsSync('public')) {
  fs.mkdirSync('public');
}
const img = fs.readFileSync('src/assets/images/app_icon_1780886122600.png');
fs.writeFileSync('public/pwa-192x192.png', img);
fs.writeFileSync('public/pwa-512x512.png', img);
fs.writeFileSync('public/apple-touch-icon.png', img);
