import { Controller, Get, Param, Res, Req, UseGuards } from '@nestjs/common';
import { Response, Request } from 'express';
import { FileService } from './file.service';
import * as fs from 'fs';
import * as path from 'path';

@Controller('files')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Get(':file_id')
  async getFile(@Param('file_id') fileId: string, @Req() req: Request, @Res() res: Response) {
    const file = await this.fileService.getFileById(parseInt(fileId));
    
    // Check if file exists
    if (!fs.existsSync(file.file_path)) {
      return res.status(404).json({ message: 'File not found on disk' });
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
      const fileStream = fs.createReadStream(file.file_path, { start, end });
      fileStream.pipe(res);
    } else {
      // For non-range requests or non-video files, send entire file
      res.set('Content-Length', fileSize.toString());
      // Stream the file
      const fileStream = fs.createReadStream(file.file_path);
      fileStream.pipe(res);
    }
  }
}