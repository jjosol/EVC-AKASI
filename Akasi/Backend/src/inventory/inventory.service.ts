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
          medName: item.name, // Frontend sends 'name', we store as 'medName'
          expiration: item.expirationDate ? new Date(item.expirationDate) : null,
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
      // If name is different, create new entry and delete old one
      if (medName !== data.name) {
        const newItem = await this.prisma.inventory.create({
          data: {
            medName: data.name,
            expiration: data.expirationDate ? new Date(data.expirationDate) : null,
            count: Number(data.count)
          }
        });
        
        // Delete old entry
        await this.prisma.inventory.delete({
          where: {
            med_id_medName: {
              med_id,
              medName
            }
          }
        });
        
        return newItem;
      }

      // If name is same, just update
      return await this.prisma.inventory.update({
        where: {
          med_id_medName: {
            med_id,
            medName
          }
        },
        data: {
          expiration: data.expirationDate ? new Date(data.expirationDate) : null,
          count: Number(data.count)
        }
      });
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

  async deleteGroupByName(medName: string) {
    try {
      const result = await this.prisma.inventory.deleteMany({
        where: {
          medName: medName
        }
      });
      return result;
    } catch (error) {
      throw new BadRequestException('Failed to delete medicine group');
    }
  }

  async reduceInventory(med_id: number, quantity: number) {
    try {
      console.log('Reducing inventory:', { med_id, quantity });

      const item = await this.prisma.inventory.findFirst({
        where: { med_id: med_id }
      });

      if (!item) {
        console.error(`Medicine with ID ${med_id} not found`);
        throw new BadRequestException(`Medicine with ID ${med_id} not found`);
      }

      if (item.count < quantity) {
        console.error(`Insufficient quantity. Available: ${item.count}, Requested: ${quantity}`);
        throw new BadRequestException(
          `Insufficient quantity. Available: ${item.count}, Requested: ${quantity}`
        );
      }

      const result = await this.prisma.inventory.update({
        where: {
          med_id_medName: {
            med_id: med_id,
            medName: item.medName
          }
        },
        data: {
          count: {
            decrement: quantity
          }
        }
      });

      console.log('Inventory reduced successfully:', result);
      return result;
    } catch (error) {
      console.error('Reduce inventory error:', error);
      throw new BadRequestException(error.message || 'Failed to update inventory');
    }
  }
}