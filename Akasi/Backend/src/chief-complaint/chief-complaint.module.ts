import { Module } from '@nestjs/common';
import { ChiefComplaintService } from './chief-complaint.service';
import { ChiefComplaintController } from './chief-complaint.controller';
import { PrismaModule } from '../prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ChiefComplaintController],
  providers: [ChiefComplaintService],
  exports: [ChiefComplaintService]
})
export class ChiefComplaintModule {}
