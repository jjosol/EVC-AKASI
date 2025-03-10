import { Injectable } from '@nestjs/common';
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
}
