import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AdminsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllAdmins() {
    // Fetch all admins from the Admin table
    return await this.prisma.admin.findMany();
  }
}
