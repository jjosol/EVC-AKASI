import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { FileService } from './file.service';

@Controller('files')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get(':file_id')
  async getFile(@Param('file_id') fileId: string, @Res() res: Response) {
    try {
      const file = await this.fileService.getFileById(parseInt(fileId));
      if (!file?.file_path) {
        return res.status(404).send('File not found');
      }

      // Return direct Google Drive link for client to use
      return res.json({ url: file.file_path });
    } catch (error) {
      console.error('Error serving file:', error);
      return res.status(500).send('Error serving file');
    }
  }
}