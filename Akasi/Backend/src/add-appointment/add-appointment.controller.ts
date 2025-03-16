import { Body, Controller, Post, Get, Put, Delete, Param, ParseIntPipe, NotFoundException, BadRequestException, Query } from '@nestjs/common';
import { AddAppointmentService } from './add-appointment.service';

// Define DTO for appointment data
class CreateAppointmentDto {
    client_id: number;
    date: string; // ISO date string
    hour: number;
    minute: number;
    complaint: string;
}

@Controller('add-appointment')
export class AddAppointmentController {
    constructor(private readonly service: AddAppointmentService) { }

    // POST request to create a consultation record
    @Post()
    async createAppointment(@Body() body: CreateAppointmentDto) {
        try {
            console.log('Received POST request body:', body); // Debug log

            // Validate required fields
            if (!body.client_id) {
                throw new BadRequestException('Client ID is required');
            }

            if (!body.date) {
                throw new BadRequestException('Date is required');
            }

            if (body.hour === undefined || body.hour === null) {
                throw new BadRequestException('Hour is required');
            }

            if (body.minute === undefined || body.minute === null) {
                throw new BadRequestException('Minute is required');
            }

            if (!body.complaint) {
                throw new BadRequestException('Complaint is required');
            }

            // Parse date to ensure it's valid
            let appointmentDate: Date;
            try {
                appointmentDate = new Date(body.date);
                if (isNaN(appointmentDate.getTime())) {
                    throw new Error('Invalid date format');
                }
            } catch (error) {
                throw new BadRequestException('Invalid date format');
            }

            const appointment = await this.service.createAppointment({
                client_id: Number(body.client_id),
                date: appointmentDate,
                hour: Number(body.hour),
                minute: Number(body.minute),
                complaint: String(body.complaint),
            });

            return {
                success: true,
                message: 'Appointment created successfully',
                data: appointment
            };
        } catch (error) {
            console.error('Create appointment error:', error);

            if (error instanceof BadRequestException) {
                throw error;
            }

            throw new BadRequestException(error.message || 'Failed to create appointment');
        }
    }
}