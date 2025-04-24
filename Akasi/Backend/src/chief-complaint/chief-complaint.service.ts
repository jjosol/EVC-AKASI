import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateChiefComplaintDto, UpdateChiefComplaintDto } from './dto/chief-complaint.dto';

@Injectable()
export class ChiefComplaintService {
  constructor(private prisma: PrismaService) {}

  // Create a new chief complaint
  async create(createChiefComplaintDto: CreateChiefComplaintDto) {
    // First verify that the consultation exists
    const consultation = await this.prisma.consultation_records.findUnique({
      where: { consultation_id: createChiefComplaintDto.consultation_id },
    });

    if (!consultation) {
      throw new NotFoundException(
        `Consultation with ID ${createChiefComplaintDto.consultation_id} not found`,
      );
    }

    return this.prisma.chiefcomplaint.create({
      data: createChiefComplaintDto,
    });
  }

  // Get all chief complaints for a specific consultation
  async findAllByConsultation(consultation_id: number) {
    const complaints = await this.prisma.chiefcomplaint.findMany({
      where: { consultation_id },
      orderBy: { chiefcomplaint_id: 'asc' },
    });

    if (!complaints.length) {
      return []; // Return empty array instead of throwing error when no complaints found
    }

    return complaints;
  }

  // Get a specific chief complaint by ID
  async findOne(chiefcomplaint_id: number) {
    const complaint = await this.prisma.chiefcomplaint.findUnique({
      where: { chiefcomplaint_id },
    });

    if (!complaint) {
      throw new NotFoundException(
        `Chief complaint with ID ${chiefcomplaint_id} not found`,
      );
    }

    return complaint;
  }

  // Update a chief complaint
  async update(
    chiefcomplaint_id: number,
    updateChiefComplaintDto: UpdateChiefComplaintDto,
  ) {
    // First check if the complaint exists
    await this.findOne(chiefcomplaint_id);

    return this.prisma.chiefcomplaint.update({
      where: { chiefcomplaint_id },
      data: updateChiefComplaintDto,
    });
  }

  // Delete a chief complaint
  async remove(chiefcomplaint_id: number) {
    // First check if the complaint exists
    await this.findOne(chiefcomplaint_id);

    return this.prisma.chiefcomplaint.delete({
      where: { chiefcomplaint_id },
    });
  }

  // Create multiple chief complaints at once
  async createMany(complaints: CreateChiefComplaintDto[]) {
    const consultation_id = complaints[0]?.consultation_id;
    
    if (!consultation_id) {
      throw new NotFoundException('Consultation ID is required');
    }

    // Check if consultation exists
    const consultation = await this.prisma.consultation_records.findUnique({
      where: { consultation_id },
    });

    if (!consultation) {
      throw new NotFoundException(
        `Consultation with ID ${consultation_id} not found`,
      );
    }

    // Create all complaints
    const createdComplaints = [];
    for (const complaint of complaints) {
      const created = await this.prisma.chiefcomplaint.create({
        data: complaint,
      });
      createdComplaints.push(created);
    }

    return createdComplaints;
  }

  // Delete all chief complaints for a consultation
  async removeAllByConsultation(consultation_id: number) {
    // Check if consultation exists
    const consultation = await this.prisma.consultation_records.findUnique({
      where: { consultation_id },
    });

    if (!consultation) {
      throw new NotFoundException(
        `Consultation with ID ${consultation_id} not found`,
      );
    }

    // Delete all complaints for this consultation
    return this.prisma.chiefcomplaint.deleteMany({
      where: { consultation_id },
    });
  }
}
