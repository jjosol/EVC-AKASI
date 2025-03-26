import { driveService } from './drive.config.mjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function uploadFileToDrive(filePath) {
  try {
    // Read file
    const fileContent = await fs.readFile(filePath);
    const fileName = path.basename(filePath);

    // Create file metadata
    const fileMetadata = {
      name: fileName,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID]
    };

    // Upload file
    const response = await driveService.files.create({
      requestBody: fileMetadata,
      media: {
        mimeType: 'application/octet-stream',
        body: fileContent
      },
      fields: 'id, webViewLink'
    });

    // Make file public
    await driveService.permissions.create({
      fileId: response.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone'
      }
    });

    console.log('File uploaded successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Upload failed:', error.message);
    throw error;
  }
}

// Test upload with a sample file
const testFilePath = path.join(__dirname, 'test.txt');
uploadFileToDrive(testFilePath);