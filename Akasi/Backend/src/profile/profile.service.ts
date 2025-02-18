import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: number, role: string) {
    if (role === 'admin') {
      const admin = await this.prisma.admin.findUnique({
        where: { admin_id: userId },
      });
      return {
        name: admin?.username || 'N/A',
        email: admin?.gmail || 'N/A',
        role: 'Administrator',
      };
    }

    const client = await this.prisma.client.findUnique({
      where: { client_id: userId },
    });
    return {
      name: client?.name || 'N/A',
      email: client?.gmail || 'N/A',
      role: 'Client',
      age: client?.age || 'N/A',
      gender: client?.gender || 'N/A',
      grade: client?.grade || 'N/A',
      section: client?.section || 'N/A',
    };
  }
}