import { Controller, Get, Query } from '@nestjs/common';
import { DailyAppointmentService } from './daily-appointment.service';
@Controller('admin-fetch-appointments')
export class DailyAppointmentController {
    constructor(private readonly appointmentsService: DailyAppointmentService) { }

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
