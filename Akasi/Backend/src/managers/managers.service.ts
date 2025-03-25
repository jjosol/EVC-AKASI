import { Injectable, NotFoundException, ConflictException, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ManagersService {
  constructor(private prisma: PrismaService) {}

  async getAllManagers() {
    return await this.prisma.manager.findMany({
      select: {
        manager_id: true,
        username: true,
        gmail: true,
      },
    });
  }

  async getManagerById(managerId: number) {
    const manager = await this.prisma.manager.findUnique({
      where: { 
        manager_id: managerId 
      },
      select: {
        manager_id: true,
        username: true,
        gmail: true,
      },
    });

    if (!manager) {
      throw new NotFoundException(`Manager with ID ${managerId} not found`);
    }

    return manager;
  }

  async createManager(data: { username: string; password: string; gmail: string }) {
    // Check if username is already taken
    const existingManager = await this.prisma.manager.findFirst({
      where: {
        OR: [
          { username: data.username },
          { gmail: data.gmail },
        ],
      },
    });

    if (existingManager) {
      throw new ConflictException('Username or email already exists');
    }

    // Hash the password
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(data.password, salt);

    // Create the manager
    const manager = await this.prisma.manager.create({
      data: {
        username: data.username,
        password: hashedPassword,
        gmail: data.gmail,
      },
      select: {
        manager_id: true,
        username: true,
        gmail: true,
      },
    });

    return manager;
  }

  async updateManager(managerId: number, data: { username?: string; password?: string; gmail?: string }) {
    // Check if manager exists
    const manager = await this.prisma.manager.findUnique({
      where: { 
        manager_id: managerId 
      },
    });

    if (!manager) {
      throw new NotFoundException(`Manager with ID ${managerId} not found`);
    }

    // Check if username or email is already taken
    if (data.username || data.gmail) {
      const existingManager = await this.prisma.manager.findFirst({
        where: {
          OR: [
            data.username ? { username: data.username } : null,
            data.gmail ? { gmail: data.gmail } : null,
          ].filter(Boolean),
          NOT: {
            manager_id: managerId,
          },
        },
      });

      if (existingManager) {
        throw new ConflictException('Username or email already in use by another account');
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (data.username) updateData.username = data.username;
    if (data.gmail) updateData.gmail = data.gmail;
    
    // Hash the password if it's provided
    if (data.password) {
      const salt = await bcrypt.genSalt();
      updateData.password = await bcrypt.hash(data.password, salt);
    }

    // Update the manager
    const updatedManager = await this.prisma.manager.update({
      where: { 
        manager_id: managerId 
      },
      data: updateData,
      select: {
        manager_id: true,
        username: true,
        gmail: true,
      },
    });

    return updatedManager;
  }

  async deleteManager(id: number) {
    try {
      // Managers don't have direct dependencies according to your model,
      // but using transaction for consistency and future-proofing
      return await this.prisma.$transaction(async (tx) => {
        // If there are any manager-specific relations that need to be deleted,
        // they would go here
        
        // Finally delete the manager
        return await tx.manager.delete({ where: { manager_id: id } });
      });
    } catch (error) {
      console.error('Error deleting manager:', error);
      throw new HttpException('Failed to delete manager', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
