import { Injectable, BadRequestException } from '@nestjs/common';
import { InventoryService } from '../inventory/inventory.service';
import { PrismaService } from '../prisma.service';

@Injectable()
export class MedAdministrationService {
  constructor(
    private prisma: PrismaService,
    private inventoryService: InventoryService
  ) {}

  async create(data: {
    client_id: number;
    admin_id: number;
    med_id: number;
    consultation_id: number;
    start_date: Date;
    end_date: Date;
    patient: string;
    schedule: string;
    medName: string;
    count: number;
  }) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        // First, retrieve the inventory within the transaction
        const inventory = await tx.inventory.findUnique({
          where: {
            med_id_medName: {
              med_id: data.med_id,
              medName: data.medName,
            },
          },
        });

        if (!inventory) {
          throw new BadRequestException('Inventory item not found');
        }

        if (inventory.count < data.count) {
          throw new BadRequestException('Not enough stock');
        }

        // Create med administration record
        const medAdmin = await tx.med_administration.create({
          data,
        });

        // Update inventory
        await tx.inventory.update({
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

        return medAdmin;
      });
    } catch (error) {
      console.error('Error in create method:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to create med administration record');
    }
  }

  async findAll() {
    return this.prisma.med_administration.findMany();
  }

  async findByConsultation(consultation_id: number) {
    return this.prisma.med_administration.findMany({
      where: { consultation_id },
      include: {
        inventory: true // Include the related inventory data
      }
    });
  }
}
