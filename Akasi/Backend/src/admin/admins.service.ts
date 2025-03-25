import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllAdmins() {
    try {
      return await this.prisma.admin.findMany();
    } catch (error) {
      throw new HttpException('Failed to fetch admins', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async createAdmin(adminData: any) {
    try {
      // Check if username already exists
      const existingAdmin = await this.prisma.admin.findFirst({
        where: { username: adminData.username }
      });

      if (existingAdmin) {
        throw new HttpException('Username already exists', HttpStatus.BAD_REQUEST);
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(adminData.password, 10);

      // Create the admin including the required "name" field
      return await this.prisma.admin.create({
        data: {
          username: adminData.username,
          password: hashedPassword,
          gmail: adminData.gmail,
          name: adminData.name // Ensure "name" is provided in adminData
        }
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Failed to create admin', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async updateAdmin(id: number, adminData: any) {
    try {
      // Create data object for update
      const updateData: any = {
        username: adminData.username,
        gmail: adminData.gmail,
      };

      // If password is provided, hash it
      if (adminData.password) {
        updateData.password = await bcrypt.hash(adminData.password, 10);
      }

      // Update the admin
      return await this.prisma.admin.update({
        where: { admin_id: id },
        data: updateData
      });
    } catch (error) {
      throw new HttpException('Failed to update admin', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async deleteAdmin(id: number) {
    try {
      // Use a transaction to ensure all related records are deleted
      return await this.prisma.$transaction(async (tx) => {
        // Delete all HSU bulletin files first
        await tx.hSU_bulletin_files.deleteMany({
          where: {
            bulletin: {
              admin_id: id
            }
          }
        });
        
        // Delete HSU bulletins
        await tx.hSU_bulletin.deleteMany({ where: { admin_id: id } });
        
        // For consultation_records related to this admin
        const consultations = await tx.consultation_records.findMany({
          where: { admin_id: id },
          select: { consultation_id: true }
        });
        
        const consultationIds = consultations.map(c => c.consultation_id);
        
        // Delete consultation diagnoses for these consultations
        if (consultationIds.length > 0) {
          await tx.consultation_diagnosis.deleteMany({
            where: { consultation_id: { in: consultationIds } }
          });
        }
        
        // Delete med administrations
        await tx.medAdministration.deleteMany({ where: { admin_id: id } });
        
        // Delete consultation records
        await tx.consultation_records.deleteMany({ where: { admin_id: id } });
        
        // Finally delete the admin
        return await tx.admin.delete({ where: { admin_id: id } });
      });
    } catch (error) {
      console.error('Error deleting admin:', error);
      throw new HttpException('Failed to delete admin', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
