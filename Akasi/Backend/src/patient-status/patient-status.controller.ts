// src/controllers/patient-status.controller.ts
import { Controller, Get, Post, Param, Body, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { PatientStatusService } from './patient-status.service';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

@Controller('patient-status')
export class PatientStatusController {
    constructor(private readonly patientStatusService: PatientStatusService) {}

    @Get('counts')
    @UseGuards(JwtAuthGuard)
    async getPatientStatusCounts() {
        try {
            const counts = await this.patientStatusService.getPatientStatusCounts();
            return {
                success: true,
                data: counts
            };
        } catch (error) {
            throw new HttpException(
                'Failed to fetch patient status counts: ' + error.message,
                error.status || HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Get('pending')
    @UseGuards(JwtAuthGuard)
    async getPatientsWithPendingFiles() {
        try {
            const patients = await this.patientStatusService.getPatientsWithPendingFiles();
            return {
                success: true,
                data: patients
            };
        } catch (error) {
            throw new HttpException(
                'Failed to fetch patients with pending files: ' + error.message,
                error.status || HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Post(':id')
    @UseGuards(JwtAuthGuard)
    async updatePatientStatus(@Param('id') id: string) {
        try {
            const status = await this.patientStatusService.updatePatientStatus(parseInt(id));
            return {
                success: true,
                status: status
            };
        } catch (error) {
            throw new HttpException(
                'Failed to update patient status: ' + error.message,
                error.status || HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}