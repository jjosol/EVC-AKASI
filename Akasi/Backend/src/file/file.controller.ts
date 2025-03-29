import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { FileService } from './file.service';

@Controller('files')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Get(':file_id')
  async getFile(@Param('file_id') fileId: string, @Res() res: Response) {
    const file = await this.fileService.getFileById(parseInt(fileId));
    
    // Set proper content type and headers for better streaming
    res.set({
      'Content-Type': file.mime_type.split(';')[0], // Remove any charset parameter
      'Content-Disposition': `inline; filename="${file.file_name}"`,
      'Cache-Control': 'max-age=3600',
      'Accept-Ranges': 'bytes' // Important for video streaming
    });
    
    // For videos, use proper streaming
    if (file.mime_type.startsWith('video/')) {
      // Send the binary data as a buffer
      res.send(Buffer.from(file.data));
    } else {
      // For other files, send normally
      res.send(Buffer.from(file.data));
    }
  }
}