import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) { }

  // In profile.service.ts
  async getProfile(userId: number, userRole: string) {
    if (userRole === 'client') {
      return this.prisma.client.findUnique({
        where: { client_id: userId }
      });
    } else if (userRole === 'admin') {
      return this.prisma.admin.findUnique({
        where: { admin_id: userId }
      });
    }
  }
}