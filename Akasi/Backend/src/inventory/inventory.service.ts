// src/inventory/inventory.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
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

  async updateItem(med_id: number, medName: string, data: any) {
    try {
      const result = await this.prisma.inventory.update({
        where: {
          med_id_medName: {
            med_id,
            medName
          }
        },
        data: {
          medName: data.name,
          expiration: new Date(data.expirationDate),
          count: Number(data.count)
        }
      });
      return result;
    } catch (error) {
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
