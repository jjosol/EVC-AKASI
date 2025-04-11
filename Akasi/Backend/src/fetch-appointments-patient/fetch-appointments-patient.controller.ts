import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { FetchAppointmentsPatientService } from './fetch-appointments-patient.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('fetch-appointments-patient')
@UseGuards(JwtAuthGuard)
export class FetchAppointmentsPatientController {
    constructor(private readonly appointmentsService: FetchAppointmentsPatientService) { }

    @Get('upcoming')
    async getUpcomingAppointments(@Request() req, @Query('patient_id') patientId?: string) {
        // Extract patient ID and role from JWT token
        const userRole = req.user.role;
        let patientIdNum: number | undefined;

        if (userRole === 'patient') {
            // For patients, always use their own patient_id from the token
            patientIdNum = req.user.patient_id;
        } else if (userRole === 'admin' && patientId) {
            // For admins, they can query specific patients if desired
            patientIdNum = parseInt(patientId, 10);
        }

        return this.appointmentsService.getUpcomingAppointments(patientIdNum, userRole);
    }
}