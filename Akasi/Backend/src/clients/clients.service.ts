import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcrypt';

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

  async createClient(clientData: any) {
    try {
      // Check if username already exists
      const existingClient = await this.prisma.client.findFirst({
        where: { username: clientData.username }
      });

      if (existingClient) {
        throw new HttpException('Username already exists', HttpStatus.BAD_REQUEST);
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(clientData.password, 10);

      // Create the client
      return await this.prisma.client.create({
        data: {
          username: clientData.username,
          password: hashedPassword,
          name: clientData.name,
          gmail: clientData.gmail,
          age: clientData.age,
          gender: clientData.gender,
          category: clientData.category,
          grade: clientData.grade || null,
          section: clientData.section,
          type: clientData.type, // Add this line with an appropriate type value
        }
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Failed to create client', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async updateClient(id: number, clientData: any) {
    try {
      // Create data object for update
      const updateData: any = {
        username: clientData.username,
        name: clientData.name,
        gmail: clientData.gmail,
        age: clientData.age,
        gender: clientData.gender,
        category: clientData.category,
        grade: clientData.grade || null,
        section: clientData.section
      };

      // If password is provided, hash it
      if (clientData.password) {
        updateData.password = await bcrypt.hash(clientData.password, 10);
      }

      // Update the client
      return await this.prisma.client.update({
        where: { client_id: id },
        data: updateData
      });
    } catch (error) {
      throw new HttpException('Failed to update client', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async deleteClient(id: number) {
    try {
      // Use a transaction to ensure all related records are deleted
      return await this.prisma.$transaction(async (tx) => {
        // Delete all related records first
        await tx.dental_certificates.deleteMany({ where: { client_id: id } });
        await tx.medical_certificates.deleteMany({ where: { client_id: id } });
        await tx.opthal_certificates.deleteMany({ where: { client_id: id } });
        await tx.physical_exam.deleteMany({ where: { client_id: id } });
        await tx.appointment.deleteMany({ where: { client_id: id } });
        
        // For medAdministration, we need to handle it separately
        await tx.medAdministration.deleteMany({ where: { client_id: id } });
        
        // For consultation_records, we need to clean up further relationships
        const consultations = await tx.consultation_records.findMany({
          where: { client_id: id },
          select: { consultation_id: true }
        });
        
        const consultationIds = consultations.map(c => c.consultation_id);
        
        // Delete consultation diagnoses
        if (consultationIds.length > 0) {
          await tx.consultation_diagnosis.deleteMany({
            where: { consultation_id: { in: consultationIds } }
          });
        }
        
        // Now delete the consultation records
        await tx.consultation_records.deleteMany({ where: { client_id: id } });
        
        // Finally delete the client
        return await tx.client.delete({ where: { client_id: id } });
      });
    } catch (error) {
      console.error('Error deleting client:', error);
      throw new HttpException('Failed to delete client', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
