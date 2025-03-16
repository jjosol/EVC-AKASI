import dotenv from 'dotenv';
import { driveService } from './drive.config.mjs';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup dirname
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Load .env from root directory
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function testConnection() {
  try {
    // First verify env variable
    console.log('Folder ID from env:', process.env.GOOGLE_DRIVE_FOLDER_ID);
    
    // Test folder access
    const files = await driveService.files.list({
      q: `'${process.env.GOOGLE_DRIVE_FOLDER_ID}' in parents`,
      pageSize: 10,
      fields: 'files(id, name, webViewLink)'
    });
    
    console.log('Connection successful:', files.data);
  } catch (error) {
    console.error('Drive test failed:', error.message);
  }
}

testConnection();