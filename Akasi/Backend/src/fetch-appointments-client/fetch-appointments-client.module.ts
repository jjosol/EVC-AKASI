import { Module } from '@nestjs/common';
import { FetchAppointmentsClientController } from './fetch-appointments-client.controller';
import { FetchAppointmentsClientService } from './fetch-appointments-client.service';
import { PrismaModule } from '../prisma.module';

@Module({
  imports: [PrismaModule], // Import PrismaModule to provide PrismaService
  controllers: [FetchAppointmentsClientController],
  providers: [FetchAppointmentsClientService]
})
export class FetchAppointmentsClientModule {}