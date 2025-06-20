import { Controller, Get, Param, Res, Req, UseGuards, Logger, NotFoundException } from '@nestjs/common';
import { Response, Request } from 'express';
import { FileService } from './file.service';
import * as fs from 'fs';
import * as path from 'path';

@Controller('files')
export class FileController {
  private readonly logger = new Logger(FileController.name);

  constructor(private readonly fileService: FileService) {}

  @Get('manual/:filename')
  async getUserManual(@Param('filename') filename: string, @Res() res: Response) {
    try {
      this.logger.log(`User manual request for: ${filename}`);
      
      // Build the absolute path to the manual file
      const absolutePath = path.join(process.cwd(), 'uploaded_files', 'manuals', filename);
      this.logger.debug(`Full manual path: ${absolutePath}`);
      
      // Check if file exists
      if (!fs.existsSync(absolutePath)) {
        this.logger.warn(`Manual not found at path: ${absolutePath}`);
        return res.status(404).json({ 
          message: 'Manual file not found on disk',
          filename: filename,
          path: absolutePath
        });
      }
      
      // Get file stats
      const stats = fs.statSync(absolutePath);
      
      // Check if file is empty or too small to be a valid PDF
      if (stats.size === 0 || stats.size < 100) {
        this.logger.warn(`Manual file is empty or too small: ${absolutePath}, size: ${stats.size} bytes`);
        return res.status(404).json({ 
          message: 'Manual file exists but appears to be empty or invalid',
          filename: filename,
          size: stats.size
        });
      }
      
      // Set response headers
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': stats.size.toString(),
        'Cache-Control': 'max-age=86400', // Cache for 24 hours
        'Access-Control-Allow-Origin': '*' // Allow cross-origin access
      });

      // Stream the file
      const fileStream = fs.createReadStream(absolutePath);
      fileStream.on('error', (err) => {
        this.logger.error(`Error streaming manual file: ${err.message}`);
        if (!res.headersSent) {
          res.status(500).json({ 
            message: 'Error streaming manual file',
            error: err.message
          });
        }
      });
      fileStream.pipe(res);
    } catch (error) {
      this.logger.error(`Error processing manual request: ${error.message}`);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  @Get(':file_id')
  async getFile(@Param('file_id') fileId: string, @Req() req: Request, @Res() res: Response) {
    try {
      this.logger.log(`File request for ID: ${fileId}`);
      const file = await this.fileService.getFileById(parseInt(fileId));

      // Build the absolute path to the file
      const absolutePath = path.join(process.cwd(), 'uploads', file.file_path);
      this.logger.debug(`Full file path: ${absolutePath}`);
      
      // Check if file exists
      if (!fs.existsSync(absolutePath)) {
        this.logger.warn(`Physical file not found at path: ${absolutePath}`);
        return res.status(404).json({ 
          message: 'File not found on disk',
          path: file.file_path,
          name: file.file_name
        });
      }
      
      // Set common headers
      res.set({
        'Content-Type': file.mime_type.split(';')[0],
        'Content-Disposition': `inline; filename="${file.file_name}"`,
        'Cache-Control': 'max-age=3600',
        'Accept-Ranges': 'bytes'
      });

      const fileSize = file.file_size;
      
      // Parse Range header for video streaming
      const rangeHeader = req.headers.range;
      
      if (rangeHeader && file.mime_type.startsWith('video/')) {
        // Handle range request for video streaming
        const parts = rangeHeader.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : Math.min(start + 1024 * 1024, fileSize - 1); // 1MB chunks by default
        const chunkSize = (end - start) + 1;

        // Validate range
        if (start >= fileSize) {
          return res.status(416).set({
            'Content-Range': `bytes */${fileSize}`
          }).end();
        }

        // Set response headers for partial content
        res.status(206).set({
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Content-Length': chunkSize.toString()
        });

        // Create read stream for specified range
        const fileStream = fs.createReadStream(absolutePath, { start, end });
        fileStream.on('error', (err) => {
          this.logger.error(`Error streaming file: ${err.message}`);
          if (!res.headersSent) {
            res.status(500).json({ message: 'Error streaming file' });
          }
        });
        fileStream.pipe(res);
      } else {
        // For non-range requests or non-video files, send entire file
        res.set('Content-Length', fileSize.toString());
        // Stream the file
        const fileStream = fs.createReadStream(absolutePath);
        fileStream.on('error', (err) => {
          this.logger.error(`Error streaming file: ${err.message}`);
          if (!res.headersSent) {
            res.status(500).json({ message: 'Error streaming file' });
          }
        });
        fileStream.pipe(res);
      }
    } catch (error) {
      this.logger.error(`Error processing file request: ${error.message}`);
      if (error instanceof NotFoundException) {
        return res.status(404).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
}