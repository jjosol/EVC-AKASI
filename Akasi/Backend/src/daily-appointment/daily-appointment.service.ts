import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class DailyAppointmentService {
    constructor(private prisma: PrismaService) { }

    /**
     * Get appointments for a specific date
     * @param dateString Date in YYYY-MM-DD format
     * @returns List of appointments for that date with patient information
     */
    async getAppointmentsByDate(dateString: string) {
        // Create Date object from string
        const date = new Date(dateString);

        // First, fetch appointments without including patient
        const appointments = await this.prisma.appointment.findMany({
            where: {
                date: date,
            },
            orderBy: [
                { hour: 'asc' },
                { minute: 'asc' }
            ],
        });

        // Then, fetch patient data for each appointment and combine them
        const appointmentsWithPatients = await Promise.all(
            appointments.map(async (appointment) => {
                const patient = await this.prisma.patient.findUnique({
                    where: { patient_id: appointment.patient_id },
                    select: {
                        name: true,
                        category: true,
                        grade: true,
                        section: true,
                    }
                });

                return {
                    ...appointment,
                    patient
                };
            })
        );

        return appointmentsWithPatients;
    }
}