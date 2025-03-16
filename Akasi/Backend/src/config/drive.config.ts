import { google } from 'googleapis';
import * as path from 'path';
import { fileURLToPath } from 'url';

const KEYFILEPATH = path.join(process.cwd(), 'credentials', 'credentials.json');
const SCOPES = ['https://www.googleapis.com/auth/drive'];

const auth = new google.auth.GoogleAuth({
  keyFile: KEYFILEPATH,
  scopes: SCOPES
});

const driveService = google.drive({ version: 'v3', auth });

export { driveService, auth };