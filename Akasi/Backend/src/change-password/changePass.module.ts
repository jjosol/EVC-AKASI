import { Module } from '@nestjs/common';
import { ChangePasswordController } from './changePass.controller';
import { ChangePasswordService } from './changePass.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [ChangePasswordController],
  providers: [ChangePasswordService, PrismaService],
})
export class ChangePasswordModule {}