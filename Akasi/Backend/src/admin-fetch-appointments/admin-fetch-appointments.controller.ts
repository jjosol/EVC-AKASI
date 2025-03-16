import { Controller, Get, Query } from '@nestjs/common';
import { AdminFetchAppointmentsService } from './admin-fetch-appointments.service';
@Controller('admin-fetch-appointments')
export class AdminFetchAppointmentsController {
    constructor(private readonly appointmentsService: AdminFetchAppointmentsService) { }

    /**
     * Get appointments for a specific date
     * @param date Date in YYYY-MM-DD format
     * @returns List of appointments for that date
     */
    @Get('by-date')
    async getAppointmentsByDate(@Query('date') date: string) {
        return this.appointmentsService.getAppointmentsByDate(date);
    }
}
