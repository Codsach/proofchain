const fs = require('fs');
const path = require('path');

const dirs = [
  path.join(__dirname, '../src/app/(dashboard)/investigator'),
  path.join(__dirname, '../src/app/(dashboard)/analyst')
];

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Replacements
  content = content.replace(/border-white\/5/g, 'border-dash-border');
  content = content.replace(/border-white\/10/g, 'border-dash-border');
  content = content.replace(/bg-white\/\[0\.01\]/g, 'bg-dash-sidebar');
  content = content.replace(/bg-white\/\[0\.02\]/g, 'bg-dash-card');
  content = content.replace(/bg-white\/\[0\.03\]/g, 'bg-dash-hover');
  content = content.replace(/bg-white\/5/g, 'bg-dash-border');
  content = content.replace(/text-white\/40/g, 'text-dash-muted');
  content = content.replace(/text-white\/60/g, 'text-dash-muted');
  
  // Emerald
  content = content.replace(/text-emerald-500/g, 'text-dash-accent');
  content = content.replace(/text-emerald-400/g, 'text-dash-accent');
  content = content.replace(/border-emerald-500\/20/g, 'border-dash-accent/20');
  content = content.replace(/border-emerald-500\/50/g, 'border-dash-accent/50');
  content = content.replace(/bg-emerald-500\/10/g, 'bg-dash-accent/10');
  content = content.replace(/bg-emerald-500\/20/g, 'bg-dash-accent/20');
  content = content.replace(/bg-emerald-500\/\[0\.02\]/g, 'bg-dash-accent/[0.02]');
  
  if (original !== content) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${filePath}`);
  }
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      walk(full);
    } else if (full.endsWith('.tsx')) {
      replaceInFile(full);
    }
  }
}

dirs.forEach(d => {
  if (fs.existsSync(d)) {
    walk(d);
  }
});
