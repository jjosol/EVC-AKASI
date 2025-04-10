import { Module } from '@nestjs/common';
import { DailyAppointmentController } from './daily-appointment.controller';
import { DailyAppointmentService } from './daily-appointment.service';
import { PrismaService } from '../prisma.service';

@Module({
    providers: [DailyAppointmentService, PrismaService],
    controllers: [DailyAppointmentController]
})
export class DailyAppointmentModule { }
