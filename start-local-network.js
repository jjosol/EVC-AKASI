// start-local-network.js - Script to start the app in local network mode

const { spawn } = require('child_process');
const path = require('path');
const { updateEnvFile, getLocalIP } = require('./network-config');

// Update the .env.local file with the current IP
updateEnvFile();

const localIP = getLocalIP();
console.log('\nStarting servers...\n');

// Start backend server
const backendProcess = spawn('npm', ['run', 'start'], { 
  cwd: path.join(__dirname, 'Akasi', 'Backend'),
  stdio: 'inherit',
  shell: true
});

// Start frontend server with host set to 0.0.0.0 to expose on network
const frontendProcess = spawn('npm', ['run', 'dev', '--', '--host', '0.0.0.0'], { 
  cwd: path.join(__dirname, 'Akasi', 'Frontend'),
  stdio: 'inherit',
  shell: true
});

// Handle cleanup when the script is terminated
process.on('SIGINT', () => {
  console.log('Shutting down servers...');
  backendProcess.kill();
  frontendProcess.kill();
  process.exit();
});

console.log(`\nPress Ctrl+C to stop all servers.\n`);
