import { Module } from '@nestjs/common';
import { AdminFetchAppointmentsController } from './admin-fetch-appointments.controller';
import { AdminFetchAppointmentsService } from './admin-fetch-appointments.service';
import { PrismaService } from '../prisma.service';

@Module({
    providers: [AdminFetchAppointmentsService, PrismaService],
    controllers: [AdminFetchAppointmentsController]
})
export class AdminFetchAppointmentsModule { }
