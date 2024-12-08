// src/inventory/inventory.service.ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async getAllItems() {
    try {
      return await this.prisma.inventory.findMany();
    } catch (error) {
      throw new BadRequestException('Failed to fetch inventory items');
    }
  }

  async addItem(item: any) {
    try {
      const result = await this.prisma.inventory.create({
        data: {
          medName: item.name,
          expiration: new Date(item.expirationDate),
          count: Number(item.count)
        }
      });
      return result;
    } catch (error) {
      throw new BadRequestException('Failed to add inventory item');
    }
  }

  async getItemByIdAndName(med_id: number, medName: string) {
    try {
      const item = await this.prisma.inventory.findUnique({
        where: {
          med_id_medName: {
            med_id,
            medName
          }
        }
      });
      if (!item) {
        throw new NotFoundException(`Inventory item with id ${med_id} and name ${medName} not found`);
      }
      return item;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to fetch inventory item');
    }
  }

  async updateItem(med_id: number, medName: string, data: any) {
    try {
      // First check if item exists
      await this.getItemByIdAndName(med_id, medName);

      // Update the item
      const result = await this.prisma.inventory.update({
        where: {
          med_id_medName: {
            med_id,
            medName
          }
        },
        data: {
          count: Number(data.count)
        }
      });
      return result;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to update inventory item');
    }
  }

  async deleteItem(med_id: number, medName: string) {
    try {
      const result = await this.prisma.inventory.delete({
        where: {
          med_id_medName: {
            med_id,
            medName
          }
        }
      });
      return result;
    } catch (error) {
      throw new BadRequestException('Failed to delete inventory item');
    }
  }
}
