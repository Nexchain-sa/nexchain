/**
 * Run this script once to download Tajawal fonts from Google Fonts
 * node download-fonts.js
 */
const https = require('https');
const fs    = require('fs');
const path  = require('path');

const fonts = [
  {
    url:  'https://fonts.gstatic.com/s/tajawal/v10/Iura6YBj_oCad4k1rzaLCr5IlLA.ttf',
    name: 'Tajawal-Regular.ttf',
  },
  {
    url:  'https://fonts.gstatic.com/s/tajawal/v10/Iura6YBj_oCad4k1nzWLCr5IlLA.ttf',
    name: 'Tajawal-Medium.ttf',
  },
  {
    url:  'https://fonts.gstatic.com/s/tajawal/v10/Iura6YBj_oCad4k1nTeLCr5IlLA.ttf',
    name: 'Tajawal-Bold.ttf',
  },
];

const dir = path.join(__dirname, 'assets', 'fonts');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive:true });

fonts.forEach(({ url, name }) => {
  const dest = path.join(dir, name);
  if (fs.existsSync(dest)) { console.log(`✓ ${name} already exists`); return; }
  const file = fs.createWriteStream(dest);
  https.get(url, res => {
    res.pipe(file);
    file.on('finish', () => { file.close(); console.log(`✅ Downloaded ${name}`); });
  }).on('error', err => {
    fs.unlink(dest, ()=>{});
    console.error(`❌ Error downloading ${name}:`, err.message);
  });
});
