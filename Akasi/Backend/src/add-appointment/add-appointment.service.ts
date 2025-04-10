import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AddAppointmentService {
    constructor(private prisma: PrismaService) { }

    async getBookedTimeSlots(date: Date) {
        console.log('Input date:', date);

        // Create a date string in YYYY-MM-DD format to avoid timezone issues
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateString = `${year}-${month}-${day}`;

        console.log('Formatted date string for query:', dateString);

        // Query using string comparison for more reliable results
        const appointments = await this.prisma.appointment.findMany({
            where: {
                date: {
                    // Use gte and lt for reliable date range query
                    gte: new Date(`${dateString}T00:00:00Z`),
                    lt: new Date(`${dateString}T23:59:59Z`),
                },
            },
            select: {
                appointment_id: true,
                hour: true,
                minute: true,
            },
        });

        console.log(`Found ${appointments.length} booked slots for date ${dateString}:`, appointments);

        return appointments.map(slot => ({
            hour: Number(slot.hour),
            minute: Number(slot.minute)
        }));
    }

    async isTimeSlotAvailable(date: Date, hour: number, minute: number): Promise<boolean> {
        // Format date to match database format (YYYY-MM-DD)
        const dateOnly = new Date(date);
        dateOnly.setHours(0, 0, 0, 0);

        // Find any appointment at this date and time
        const existingAppointment = await this.prisma.appointment.findFirst({
            where: {
                date: dateOnly,
                hour: hour,
                minute: minute,
            },
        });

        // Return true if no appointment exists at this time
        return !existingAppointment;
    }


    async createAppointment(data: {
        patient_id: number;
        date: Date;
        hour: number;
        minute: number;
        complaint: string;

    }) {
        try {
            const appointment = await this.prisma.appointment.create({
                data,
            });
            return appointment;
        } catch (error) {
            throw new Error(`Error creating appointment: ${error.message}`);
        }
    }

    async updateAppointmentStatus(id: number, data: { status: string; notes?: string }) {
        try {
            // First check if appointment exists
            const appointment = await this.prisma.appointment.findUnique({
                where: { appointment_id: id }
            });

            if (!appointment) {
                throw new NotFoundException(`Appointment with ID ${id} not found`);
            }

            // Update the appointment
            return await this.prisma.appointment.update({
                where: { appointment_id: id },
                data: {
                    status: data.status,
                    notes: data.notes || null
                }
            });
        } catch (error) {
            throw error;
        }
    }

    async deleteAppointment(id: number) {
        try {
            // First check if appointment exists
            const appointment = await this.prisma.appointment.findUnique({
                where: { appointment_id: id }
            });

            if (!appointment) {
                throw new NotFoundException(`Appointment with ID ${id} not found`);
            }

            // Delete the appointment
            return await this.prisma.appointment.delete({
                where: { appointment_id: id }
            });
        } catch (error) {
            throw error;
        }
    }
}
