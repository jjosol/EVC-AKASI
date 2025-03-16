import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class FetchAppointmentsClientService {
    constructor(private prisma: PrismaService) { }

    async getUpcomingAppointments(clientId?: number) {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to beginning of day

        // Build the where clause with date filter
        const where: any = {
            date: {
                gte: today,
            },
        };

        // Add client_id filter if provided
        if (clientId !== undefined) {
            where.client_id = clientId;
        }

        // First fetch appointments with filters
        const appointments = await this.prisma.appointment.findMany({
            where,
            orderBy: [
                { date: 'asc' },
                { hour: 'asc' },
                { minute: 'asc' },
            ],
        });

        // Then manually fetch client data for each appointment
        const appointmentsWithClients = await Promise.all(
            appointments.map(async (appointment) => {
                const client = await this.prisma.client.findUnique({
                    where: { client_id: appointment.client_id },
                    select: {
                        name: true,
                        category: true,
                        grade: true,
                        section: true,
                    },
                });

                return {
                    ...appointment,
                    client,
                };
            })
        );

        return appointmentsWithClients;
    }
}