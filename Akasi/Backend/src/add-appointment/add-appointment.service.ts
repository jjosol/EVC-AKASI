import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AddAppointmentService {
    constructor(private prisma: PrismaService) { }

    async createAppointment(data: {
        client_id: number;
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
