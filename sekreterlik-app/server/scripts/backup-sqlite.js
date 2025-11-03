const fs = require('fs');
const path = require('path');

// Paths
const root = path.join(__dirname, '..');
const dbPath = path.join(root, 'database.sqlite');
const backupsDir = path.join(root, 'backups');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
}

function main() {
  ensureDir(backupsDir);
  if (!fs.existsSync(dbPath)) {
    console.error('Database file not found:', dbPath);
    process.exit(1);
  }
  const dest = path.join(backupsDir, `database_${timestamp()}.sqlite`);
  fs.copyFileSync(dbPath, dest);
  console.log('Backup created:', dest);
}

main();


