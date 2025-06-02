// network-config.js - Utility to get and set local network IP

const fs = require('fs');
const path = require('path');
const os = require('os');

// Get local IP address
const getLocalIP = () => {
  const nets = os.networkInterfaces();
  const results = {};

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      if (net.family === 'IPv4' && !net.internal) {
        if (!results[name]) {
          results[name] = [];
        }
        results[name].push(net.address);
      }
    }
  }

  // Find the first available external IPv4 address
  for (const [, addresses] of Object.entries(results)) {
    if (addresses.length > 0) {
      return addresses[0];
    }
  }
  
  // Fallback to localhost
  return '127.0.0.1';
};

// Create or update the .env.local file with the detected IP
const updateEnvFile = () => {
  const localIP = getLocalIP();
  const frontendPath = path.join(__dirname, 'Akasi', 'Frontend');
  const envFilePath = path.join(frontendPath, '.env.local');
  
  const envContent = `# Auto-generated environment file for local network deployment
# Last updated: ${new Date().toISOString()}

# API base URL using local network IP
VITE_API_BASE_URL=http://${localIP}:3001
`;

  fs.writeFileSync(envFilePath, envContent);
  
  console.log('\n==================================');
  console.log(`Local network IP detected: ${localIP}`);
  console.log('==================================');
  console.log(`\nFrontend will be accessible at: http://${localIP}:3000`);
  console.log(`Backend API will be accessible at: http://${localIP}:3001`);
  console.log(`\nUpdated ${envFilePath} with the current IP address.`);
};

// Export functions for use in other scripts
module.exports = {
  getLocalIP,
  updateEnvFile
};

// If this script is run directly, update the env file
if (require.main === module) {
  updateEnvFile();
}
