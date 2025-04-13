import { Controller, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { GetPatientConsultationsService } from './get-patient-consultations.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('get-patient-consultations')
export class GetPatientConsultationsController {
    constructor(private readonly getPatientConsultationsService: GetPatientConsultationsService) {}

    @UseGuards(JwtAuthGuard)
    @Get(':patientId')
    async getConsultationsByPatientId(@Param('patientId', ParseIntPipe) patientId: number) {
        return this.getPatientConsultationsService.getConsultationsByPatientId(patientId);
    }
}
