import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AddAppointmentService } from './add-appointment.service';
import { AddAppointmentController } from './add-appointment.controller';

@Module({
    controllers: [AddAppointmentController],
    providers: [AddAppointmentService, PrismaService],
})
export class AddAppointmentModule { }
