
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service'; // Import your Prisma service

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async getClients() {
    try {
      return await this.prisma.client.findMany();
    } catch (error) {
      console.error('Error fetching clients:', error);
      throw new Error('Error fetching clients');
    }
  }
}
