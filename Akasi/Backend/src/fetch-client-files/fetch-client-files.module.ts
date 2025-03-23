import { Module } from '@nestjs/common';
import { FetchClientFilesController } from './fetch-client-files.controller';
import { FetchClientFilesService } from './fetch-client-files.service';

@Module({
  controllers: [FetchClientFilesController],
  providers: [FetchClientFilesService]
})
export class FetchClientFilesModule { }
