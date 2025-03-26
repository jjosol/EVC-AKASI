import { Module } from '@nestjs/common';
import { FetchClientFilesAdminController } from './fetch-client-files-admin.controller';
import { FetchClientFilesAdminService } from './fetch-client-files-admin.service';

@Module({
    controllers: [FetchClientFilesAdminController],
    providers: [FetchClientFilesAdminService]
})
export class FetchClientFilesAdminModule { }
