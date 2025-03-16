import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AdminFetchAppointmentsService {
    constructor(private prisma: PrismaService) { }

    /**
     * Get appointments for a specific date
     * @param dateString Date in YYYY-MM-DD format
     * @returns List of appointments for that date with client information
     */
    async getAppointmentsByDate(dateString: string) {
        // Create Date object from string
        const date = new Date(dateString);

        // First, fetch appointments without including client
        const appointments = await this.prisma.appointment.findMany({
            where: {
                date: date,
            },
            orderBy: [
                { hour: 'asc' },
                { minute: 'asc' }
            ],
        });

        // Then, fetch client data for each appointment and combine them
        const appointmentsWithClients = await Promise.all(
            appointments.map(async (appointment) => {
                const client = await this.prisma.client.findUnique({
                    where: { client_id: appointment.client_id },
                    select: {
                        name: true,
                        category: true,
                        grade: true,
                        section: true,
                    }
                });

                return {
                    ...appointment,
                    client
                };
            })
        );

        return appointmentsWithClients;
    }
}