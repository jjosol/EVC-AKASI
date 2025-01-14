// med-administration.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class MedAdministrationService {
  constructor(private prisma: PrismaService) {}

  async getMedAdministrationByConsultation(consultationId: number) {
    try {
      return await this.prisma.medAdministration.findMany({
        where: { consultation_id: consultationId },
        include: { inventory: true }
      });
    } catch (error) {
      throw new BadRequestException('Failed to fetch med administration records');
    }
  }

  async createMedAdministration(data: any) {
    return await this.prisma.$transaction(async (prisma) => {
      try {
        // 1. Check if consultation exists
        const consultation = await prisma.consultation_records.findUnique({
          where: { consultation_id: data.consultation_id },
        });

        if (!consultation) {
          throw new BadRequestException('Consultation record not found');
        }

        // 2. Check if record already exists
        const existingRecord = await prisma.medAdministration.findFirst({
          where: {
            consultation_id: data.consultation_id,
            med_id: data.med_id,
            medName: data.medName
          }
        });

        if (existingRecord) {
          // If updating existing record, restore old quantity first
          await prisma.inventory.update({
            where: {
              med_id_medName: {
                med_id: data.med_id,
                medName: data.medName
              }
            },
            data: {
              count: {
                increment: existingRecord.count // Return old quantity
              }
            }
          });
        }

        // 3. Check inventory availability
        const inventory = await prisma.inventory.findFirst({
          where: {
            med_id: data.med_id,
            medName: data.medName,
          },
        });

        if (!inventory) {
          throw new BadRequestException('Medicine not found in inventory');
        }

        if (inventory.count < data.count) {
          throw new BadRequestException(`Insufficient inventory. Available: ${inventory.count}`);
        }

        // 4. Update inventory (reduce quantity)
        await prisma.inventory.update({
          where: {
            med_id_medName: {
              med_id: data.med_id,
              medName: data.medName,
            },
          },
          data: {
            count: inventory.count - data.count,
          },
        });

        // 5. Create or update med administration record
        if (existingRecord) {
          return await prisma.medAdministration.update({
            where: { consultation_id: existingRecord.consultation_id },
            data: {
              count: data.count,
              schedule: data.schedule,
              start_date: new Date(data.start_date),
              end_date: new Date(data.end_date),
              remarks: data.remarks,
              date: new Date(data.date)
            }
          });
        } else {
          return await prisma.medAdministration.create({
            data: {
              client_id: data.client_id,
              admin_id: data.admin_id,
              med_id: data.med_id,
              medName: data.medName,
              count: data.count,
              schedule: data.schedule,
              start_date: new Date(data.start_date),
              end_date: new Date(data.end_date),
              remarks: data.remarks || null,
              date: new Date(data.date),
              patient: data.patient,
              consultation_id: data.consultation_id
            }
          });
        }
      } catch (error) {
        // All operations will be rolled back if any error occurs
        throw new BadRequestException(error.message);
      }
    });
  }

  async updateMedAdministration(id: number, data: any) {
    return await this.prisma.$transaction(async (prisma) => {
      try {
        const currentRecord = await prisma.medAdministration.findUnique({
          where: { consultation_id: id }
        });

        if (!currentRecord) {
          throw new BadRequestException('Record not found');
        }

        const quantityDiff = data.count - currentRecord.count;

        if (quantityDiff !== 0) {
          const inventory = await prisma.inventory.findFirst({
            where: {
              med_id: currentRecord.med_id,
              medName: currentRecord.medName
            }
          });

          if (!inventory || inventory.count < quantityDiff) {
            throw new BadRequestException('Insufficient inventory');
          }

          await prisma.inventory.update({
            where: {
              med_id_medName: {
                med_id: currentRecord.med_id,
                medName: currentRecord.medName
              }
            },
            data: {
              count: inventory.count - quantityDiff
            }
          });
        }

        return await prisma.medAdministration.update({
          where: { consultation_id: id },
          data,
          include: {
            inventory: true
          }
        });
      } catch (error) {
        throw new BadRequestException(error.message);
      }
    });
  }

  async deleteMedAdministration(id: number) {
    return await this.prisma.$transaction(async (prisma) => {
      try {
        const record = await prisma.medAdministration.findUnique({
          where: { consultation_id: id }
        });

        if (!record) {
          throw new BadRequestException('Record not found');
        }

        await prisma.inventory.update({
          where: {
            med_id_medName: {
              med_id: record.med_id,
              medName: record.medName
            }
          },
          data: {
            count: {
              increment: record.count
            }
          }
        });

        return await prisma.medAdministration.delete({
          where: { consultation_id: id }
        });
      } catch (error) {
        throw new BadRequestException(error.message);
      }
    });
  }
}