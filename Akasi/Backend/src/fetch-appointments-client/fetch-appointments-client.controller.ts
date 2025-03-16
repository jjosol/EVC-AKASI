import { Controller, Get, Query } from '@nestjs/common';
import { FetchAppointmentsClientService } from './fetch-appointments-client.service';

@Controller('fetch-appointments-client')
export class FetchAppointmentsClientController {
    constructor(private readonly appointmentsService: FetchAppointmentsClientService) { }

    @Get('upcoming')
    async getUpcomingAppointments(@Query('client_id') clientId?: string) {
        // Convert string clientId to number if provided
        const clientIdNum = clientId ? parseInt(clientId, 10) : undefined;
        return this.appointmentsService.getUpcomingAppointments(clientIdNum);
    }
}