import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { FetchAppointmentsClientService } from './fetch-appointments-client.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('fetch-appointments-client')
@UseGuards(JwtAuthGuard)
export class FetchAppointmentsClientController {
    constructor(private readonly appointmentsService: FetchAppointmentsClientService) { }

    @Get('upcoming')
    async getUpcomingAppointments(@Request() req, @Query('client_id') clientId?: string) {
        // Extract client ID and role from JWT token
        const userRole = req.user.role;
        let clientIdNum: number | undefined;

        if (userRole === 'client') {
            // For clients, always use their own client_id from the token
            clientIdNum = req.user.client_id;
        } else if (userRole === 'admin' && clientId) {
            // For admins, they can query specific clients if desired
            clientIdNum = parseInt(clientId, 10);
        }

        return this.appointmentsService.getUpcomingAppointments(clientIdNum, userRole);
    }
}