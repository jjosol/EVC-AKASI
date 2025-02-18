import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { FileService } from './file.service';

@Controller('files')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Get(':file_id')
  async getFile(@Param('file_id') fileId: string, @Res() res: Response) {
    const file = await this.fileService.getFileById(parseInt(fileId));
    res.set({
      'Content-Type': file.mime_type,
      'Content-Disposition': `inline; filename="${file.file_name}"`
    });
    res.send(file.data);
  }
}