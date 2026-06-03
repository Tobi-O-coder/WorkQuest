// build.js — copies web source files into www/ for Capacitor
// Run with: node build.js  (or npm run build)

const fs = require('fs');
const path = require('path');

const WWW = path.join(__dirname, 'www');

function mkdir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function copyDir(src, dest) {
  mkdir(dest);
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

mkdir(WWW);

// WorkQuest.html → www/index.html
fs.copyFileSync('WorkQuest.html', path.join(WWW, 'index.html'));

// JSX component files
for (const f of ['CompanyView.jsx', 'JobSeekerView.jsx', 'ApplicantsView.jsx', 'tweaks-panel.jsx']) {
  fs.copyFileSync(f, path.join(WWW, f));
}

// Supabase API layer
copyDir('supabase', path.join(WWW, 'supabase'));

console.log('✓ Build complete → www/');
