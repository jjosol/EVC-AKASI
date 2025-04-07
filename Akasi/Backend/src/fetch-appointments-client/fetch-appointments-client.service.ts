import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class FetchAppointmentsClientService {
    constructor(private prisma: PrismaService) { }

    /**
     * Get upcoming appointments for a specific client or all appointments if admin
     * @param clientId The client ID of the authenticated user
     * @param userRole The role of the authenticated user (client, admin)
     * @returns List of upcoming appointments with client information
     */
    async getUpcomingAppointments(clientId?: number, userRole?: string) {
        // Security check: If user is a client, they can only view their own appointments
        if (userRole === 'client' && !clientId) {
            throw new UnauthorizedException('Client ID is required for client users');
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to beginning of day

        // Build the where clause with date filter
        const where: any = {
            date: {
                gte: today,
            },
        };

        // Add client_id filter if provided (applicable for both clients and admins)
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
            select: {
                appointment_id: true,
                client_id: true,
                date: true,
                hour: true,
                minute: true,
                complaint: true,
                status: true,
                notes: true,
            }
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

                if (!client) {
                    return {
                        ...appointment,
                        client: {
                            name: 'Unknown Client',
                            category: 'Unknown',
                            grade: null,
                            section: ''
                        }
                    };
                }

                return {
                    ...appointment,
                    client,
                };
            })
        );

        return appointmentsWithClients;
    }
}