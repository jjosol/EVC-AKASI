import { driveService } from './drive.config.mjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function uploadFileToDrive(filePath) {
  try {
    const fileName = path.basename(filePath);
    
    const fileMetadata = {
      name: fileName,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID]
    };

    const media = {
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      body: fs.createReadStream(filePath)
    };

    const response = await driveService.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink'
    });

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

// Test with .docs file
const docsFilePath = 'C:/Users/Acer/Documents/Github/EVC-CMS/Akasi/Backend/src/config/tanga.doc';
uploadFileToDrive(docsFilePath);