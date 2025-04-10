import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class NurseService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllNurses() {
    try {
      return await this.prisma.nurse.findMany();
    } catch (error) {
      throw new HttpException('Failed to fetch nurse', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async createNurse(nurseData: any) {
    try {
      // Check if username already exists
      const existingNurse = await this.prisma.nurse.findFirst({
        where: { username: nurseData.username }
      });

      if (existingNurse) {
        throw new HttpException('Username already exists', HttpStatus.BAD_REQUEST);
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(nurseData.password, 10);

      // Create the nurse including the required "name" field
      return await this.prisma.nurse.create({
        data: {
          username: nurseData.username,
          password: hashedPassword,
          gmail: nurseData.gmail,
          name: nurseData.name 
        }
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Failed to create nurse', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async updateNurse(id: number, nurseData: any) {
    try {
      // Create data object for update
      const updateData: any = {
        username: nurseData.username,
        gmail: nurseData.gmail,
      };

      // If password is provided, hash it
      if (nurseData.password) {
        updateData.password = await bcrypt.hash(nurseData.password, 10);
      }

      // Update the nurse
      return await this.prisma.nurse.update({
        where: { nurse_id: id },
        data: updateData
      });
    } catch (error) {
      throw new HttpException('Failed to update nurse', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async deleteNurse(id: number) {
    try {
      // Use a transaction to ensure all related records are deleted
      return await this.prisma.$transaction(async (tx) => {
        // Get bulletins for this nurse first
        const bulletins = await tx.hsu_bulletin.findMany({
          where: { nurse_id: id },
          select: { post_id: true }
        });
        
        const bulletinIds = bulletins.map(b => b.post_id);
        
        // Delete all HSU bulletin files that reference these bulletins
        if (bulletinIds.length > 0) {
          await tx.hsu_bulletin_files.deleteMany({
            where: {
              post_id: { in: bulletinIds }
            }
          });
        }
        
        // Delete HSU bulletins
        await tx.hsu_bulletin.deleteMany({ where: { nurse_id: id } });
        
        // For consultation_records related to this nurse
        const consultations = await tx.consultation_records.findMany({
          where: { nurse_id: id },
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
        await tx.medAdministration.deleteMany({ where: { nurse_id: id } });
        
        // Delete consultation records
        await tx.consultation_records.deleteMany({ where: { nurse_id: id } });
        
        // Finally delete the nurse
        return await tx.nurse.delete({ where: { nurse_id: id } });
      });
    } catch (error) {
      console.error('Error deleting nurse:', error);
      throw new HttpException('Failed to delete nurse', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}