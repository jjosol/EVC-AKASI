import { Controller, Get, Param, Res, Req, UseGuards } from '@nestjs/common';
import { Response, Request } from 'express';
import { FileService } from './file.service';

@Controller('files')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Get(':file_id')
  async getFile(@Param('file_id') fileId: string, @Req() req: Request, @Res() res: Response) {
    const file = await this.fileService.getFileById(parseInt(fileId));
    
    // Set common headers
    res.set({
      'Content-Type': file.mime_type.split(';')[0],
      'Content-Disposition': `inline; filename="${file.file_name}"`,
      'Cache-Control': 'max-age=3600',
      'Accept-Ranges': 'bytes'
    });

    const fileBuffer = Buffer.from(file.data);
    const fileSize = fileBuffer.length;
    
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
        res.status(416).set({
          'Content-Range': `bytes */${fileSize}`
        }).end();
        return;
      }

      // Set response headers for partial content
      res.status(206).set({
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Content-Length': chunkSize.toString()
      });

      // Send the requested chunk of data
      res.send(fileBuffer.slice(start, end + 1));
    } else {
      // For non-range requests or non-video files, send entire file
      res.set('Content-Length', fileSize.toString());
      res.send(fileBuffer);
    }
  }
}