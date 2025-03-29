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

class UpdateAppointmentStatusDto {
    status: 'pending' | 'approved' | 'rejected';
    notes?: string;
}

@Controller('add-appointment')
export class AddAppointmentController {
    constructor(private readonly service: AddAppointmentService) { }

    @Get('booked-slots')
    async getBookedSlots(@Query('date') dateString: string) {
        try {
            if (!dateString) {
                throw new BadRequestException('Date is required');
            }

            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                throw new BadRequestException('Invalid date format');
            }

            console.log(`Received request for booked slots on date: ${dateString}`);
            // ...before getting slots
            const slots = await this.service.getBookedTimeSlots(date);
            console.log(`DEBUG: Retrieved slots data from service:`, slots);
            console.log(`Returning ${slots.length} booked slots for date ${dateString}:`, slots);

            return slots;

        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException(error.message || 'Failed to get booked slots');
        }
    }

    // POST request to create a consultation record
    @Post()
    async createAppointment(@Body() body: CreateAppointmentDto) {
        try {
            console.log('Received POST request body:', body);

            // Validate required fields (existing validation)
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

            // Check if date is a weekend
            const dayOfWeek = appointmentDate.getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) { // 0 is Sunday, 6 is Saturday
                throw new BadRequestException('Appointments cannot be scheduled on weekends');
            }

            // Check if the time slot is already booked
            const isSlotAvailable = await this.service.isTimeSlotAvailable(
                appointmentDate,
                Number(body.hour),
                Number(body.minute)
            );

            if (!isSlotAvailable) {
                throw new BadRequestException('This time slot is already booked');
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

    @Put(':id/status')
    async updateAppointmentStatus(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateDto: UpdateAppointmentStatusDto
    ) {
        try {
            if (!['pending', 'approved', 'rejected'].includes(updateDto.status)) {
                throw new BadRequestException('Invalid status value');
            }

            const appointment = await this.service.updateAppointmentStatus(id, updateDto);

            return {
                success: true,
                message: 'Appointment status updated successfully',
                data: appointment
            };
        } catch (error) {
            console.error('Update appointment status error:', error);

            if (error instanceof BadRequestException) {
                throw error;
            }

            throw new BadRequestException(error.message || 'Failed to update appointment status');
        }
    }

    @Delete(':id')
    async deleteAppointment(@Param('id', ParseIntPipe) id: number) {
        try {
            await this.service.deleteAppointment(id);

            return {
                success: true,
                message: 'Appointment deleted successfully'
            };
        } catch (error) {
            console.error('Delete appointment error:', error);

            if (error instanceof NotFoundException) {
                throw error;
            }

            throw new BadRequestException(error.message || 'Failed to delete appointment');
        }
    }
}