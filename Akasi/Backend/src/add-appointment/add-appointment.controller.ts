// consultation-records.controller.ts
import { Body, Controller, Post, Get, Put, Delete, Param, ParseIntPipe, NotFoundException, BadRequestException, Query } from '@nestjs/common';
import { AddAppointmentService } from './add-appointment.service';



@Controller('add-appointment')
export class AddAppointmentController {
    constructor(private readonly service: AddAppointmentService) { }

    // POST request to create a consultation record
    @Post()
    async createAppointment(@Body() body: any) {
        try {
            console.log('Received POST request body:', body); // Debug log

            // Validate required fields
            if (!body.hour || !body.minute) {
                throw new BadRequestException('Missing required fields');
            }

            const Appointment = await this.service.createAppointment({
                client_id: Number(body.client_id),
                date: new Date(body.date),
                hour: Number(body.hour),
                minute: Number(body.minute),
                complaint: String(body.complaint),
            });

            return Appointment;
        } catch (error) {
            console.error('Create appointment error:', error);
            throw new BadRequestException(error.message);
        }
    }
}
