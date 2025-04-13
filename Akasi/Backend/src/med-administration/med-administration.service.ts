// med-administration.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { InventoryService } from '../medicine/inventory.service'; // Add this import

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

        // 3. Use inventoryService.reduceInventory with admin_id
        await this.inventoryService.reduceInventory(
          data.med_id,
          data.medName,
          data.count,
          `Dispensed to ${data.patient} in consultation #${data.consultation_id}`,
          data.admin_id // Pass the admin_id
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

  async updateMedAdministration(id: number, data: any, admin_id?: number) {
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

          if (!inventory) {
            throw new BadRequestException('Inventory item not found');
          }

          if (quantityDiff > 0 && inventory.count < quantityDiff) {
            throw new BadRequestException('Insufficient inventory');
          }

          // Use inventoryService instead of direct update for proper tracking
          if (quantityDiff > 0) {
            // Need to take more medication from inventory
            await this.inventoryService.reduceInventory(
              currentRecord.med_id,
              currentRecord.medName,
              quantityDiff,
              `Increased quantity for med administration #${id}, Patient: ${currentRecord.patient}`,
              admin_id || currentRecord.admin_id
            );
          } else {
            // Return medication to inventory
            await this.inventoryService.increaseInventory(
              currentRecord.med_id,
              currentRecord.medName,
              Math.abs(quantityDiff),
              `Decreased quantity for med administration #${id}, Patient: ${currentRecord.patient}`,
              admin_id || currentRecord.admin_id
            );
          }
        }

        return await prisma.medAdministration.update({
          where: { med_administration_id: id },
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
        
        // Get the inventory item to retrieve category_id and current count
        const inventoryItem = await prisma.inventory.findUnique({
          where: {
            med_id_medName: {
              med_id: record.med_id,
              medName: record.medName
            }
          }
        });

        if (!inventoryItem) {
          throw new BadRequestException('Inventory item not found');
        }

        // Update inventory count
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
        
        // Calculate new running total after returning medication
        const newTotal = inventoryItem.count + record.count;
        
        // Log the return to inventory in EditsInverntory
        await prisma.editsInverntory.create({
          data: {
            med_id: record.med_id,
            medName: record.medName,
            date: new Date(),
            cause: `Returned medication from cancelled administration (ID: ${id}, Patient: ${record.patient})`,
            addSubCount: record.count, // Positive for return
            runningTotal: newTotal,
            category_id: inventoryItem.category_id,
            admin_id: record.admin_id
          }
        });

        // Delete the medication administration record
        return await prisma.medAdministration.delete({
          where: { med_administration_id: id }
        });
      } catch (error) {
        throw new BadRequestException(error.message);
      }
    });
  }
}