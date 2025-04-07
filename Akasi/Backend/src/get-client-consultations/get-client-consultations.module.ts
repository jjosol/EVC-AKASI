import { Module } from '@nestjs/common';
import { GetClientConsultationsController } from './get-client-consultations.controller';
import { GetClientConsultationsService } from './get-client-consultations.service';

@Module({
    controllers: [GetClientConsultationsController],
    providers: [GetClientConsultationsService]
})
export class GetClientConsultationsModule { }
