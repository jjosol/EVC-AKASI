// med-administration.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { InventoryService } from '../inventory/inventory.service'; // Add this import

@Injectable()
export class MedAdministrationService {
  constructor(
    private prisma: PrismaService,
    private inventoryService: InventoryService // Add this dependency
  ) {}

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

        // 2. Check inventory availability
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

        // 3. Use inventoryService.reduceInventory instead of direct update
        await this.inventoryService.reduceInventory(
          data.med_id,
          data.medName,
          data.count,
          `Dispensed to ${data.patient} in consultation #${data.consultation_id}`
        );

        // 4. Create new med administration record
        return await prisma.medAdministration.create({
          data: {
            consultation_id: data.consultation_id,
            client_id: data.client_id,
            admin_id: data.admin_id,
            med_id: data.med_id,
            medName: data.medName,
            count: data.count,
            schedule: data.schedule,
            start_date: new Date(data.start_date),
            end_date: new Date(data.end_date),
            date: new Date(), // Use current date
            patient: data.patient,
            remarks: data.remarks || null,
            intervention: data.intervention || null,
          },
        });
      } catch (error) {
        throw new BadRequestException(error.message);
      }
    });
  }

  async updateMedAdministration(id: number, data: any) {
    return await this.prisma.$transaction(async (prisma) => {
      try {
        // Find by med_administration_id instead of consultation_id
        const currentRecord = await prisma.medAdministration.findUnique({
          where: { med_administration_id: id }
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

          // Use inventoryService.reduceInventory instead of direct update
          await this.inventoryService.reduceInventory(
            currentRecord.med_id,
            currentRecord.medName,
            quantityDiff,
            `Updated for med administration #${id}`
          );
        }

        return await prisma.medAdministration.update({
          where: { med_administration_id: id }, // Use med_administration_id as the PK
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
        // Find by med_administration_id instead of consultation_id
        const record = await prisma.medAdministration.findUnique({
          where: { med_administration_id: id }
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
          where: { med_administration_id: id }
        });
      } catch (error) {
        throw new BadRequestException(error.message);
      }
    });
  }

}