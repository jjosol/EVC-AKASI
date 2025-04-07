import { Module } from '@nestjs/common';
import { ClientStatusService } from './client-status.service';
import { ClientStatusController } from './client-status.controller';

@Module({
    controllers: [ClientStatusController],
    providers: [ClientStatusService],
    exports: [ClientStatusService],
})
export class ClientStatusModule { }
