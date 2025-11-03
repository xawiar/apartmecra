// Post-build script for Render.com SPA routing
// This script copies index.html to common routes after build
const fs = require('fs');
const path = require('path');

// Post-build script - dist directory is always in client/dist
// __dirname is: sekreterlik-app/client/scripts
// So ../dist is: sekreterlik-app/client/dist
const distDir = path.join(__dirname, '..', 'dist');
const indexHtmlPath = path.join(distDir, 'index.html');

console.log('Looking for dist directory at:', distDir);
console.log('Index.html exists:', fs.existsSync(indexHtmlPath));

// Routes that need index.html copies
const routes = [
  'members',
  'meetings',
  'events',
  'tasks',
  'archive',
  'settings',
  'regions',
  'districts',
  'towns',
  'neighborhoods',
  'villages',
  'login',
  'dashboard',
  'member-dashboard',
  'clear-all-data',
  'district-president-dashboard',
  'town-president-dashboard',
  'election-preparation',
  'management-chart',
  'calendar'
];

if (!fs.existsSync(indexHtmlPath)) {
  console.error('index.html not found in dist directory');
  process.exit(1);
}

// Read index.html
const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

// Create index.html copies for each route
routes.forEach(route => {
  const routeDir = path.join(distDir, route);
  const routeIndexPath = path.join(routeDir, 'index.html');
  
  // Create route directory if it doesn't exist
  if (!fs.existsSync(routeDir)) {
    fs.mkdirSync(routeDir, { recursive: true });
  }
  
  // Copy index.html to route directory
  fs.writeFileSync(routeIndexPath, indexHtml);
  console.log(`Created ${route}/index.html`);
});

console.log('SPA routing files created successfully');

