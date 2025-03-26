import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) { }

  async getAllItems() {
    try {
      return await this.prisma.inventory.findMany({
        include: {
          category: true
        }
      });
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
          count: Number(item.count),
          category_id: Number(item.category_id)
        },
        include: {
          category: true
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
            count: Number(data.count),
            category_id: Number(data.category_id) // Add the missing category_id field
          },
          include: {
            category: true // Include related category data in response
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
          count: Number(data.count),
          category_id: Number(data.category_id) // Also update category_id here for consistency
        },
        include: {
          category: true // Include related category data in response
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

  async reduceInventory(med_id: number, medName: string, quantity: number) {
    try {
      // Find the inventory item by med_id and medName
      const item = await this.prisma.inventory.findUnique({
        where: { med_id_medName: { med_id, medName } }
      });

      if (!item) {
        throw new BadRequestException('Item not found');
      }

      if (item.count < quantity) {
        throw new BadRequestException('Insufficient inventory');
      }

      // Update the inventory count
      const updatedItem = await this.prisma.inventory.update({
        where: { med_id_medName: { med_id, medName } },
        data: { count: item.count - quantity }
      });

      return updatedItem;
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to reduce inventory');
    }
  }

  async increaseInventory(med_id: number, medName: string, quantity: number) {
    try {
      // Find the inventory item by med_id and medName
      const item = await this.prisma.inventory.findUnique({
        where: { med_id_medName: { med_id, medName } }
      });

      if (!item) {
        throw new BadRequestException('Item not found');
      }

      // Update the inventory count
      const updatedItem = await this.prisma.inventory.update({
        where: { med_id_medName: { med_id, medName } },
        data: { count: item.count + quantity }
      });

      return updatedItem;
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to increase inventory');
    }
  }

  async getAllCategories() {
    try {
      return await this.prisma.medicineCategory.findMany();
    } catch (error) {
      throw new BadRequestException('Failed to fetch categories');
    }
  }

  async addCategory(categoryData: { name: string }) {
    try {
      return await this.prisma.medicineCategory.create({
        data: {
          name: categoryData.name
        }
      });
    } catch (error) {
      throw new BadRequestException('Failed to add category');
    }
  }

  async updateCategory(id: number, name: string) {
    try {
      return await this.prisma.medicineCategory.update({
        where: { category_id: id },
        data: { name }
      });
    } catch (error) {
      throw new BadRequestException('Failed to update category');
    }
  }

  async deleteCategory(id: number) {
    try {
      // First, delete all inventory items associated with this category
      await this.prisma.inventory.deleteMany({
        where: { category_id: id }
      });
      
      // Then, delete the category itself
      return await this.prisma.medicineCategory.delete({
        where: { category_id: id }
      });
    } catch (error) {
      console.error('Error deleting category:', error);
      if (error.code === 'P2025') {
        throw new BadRequestException('Category not found');
      } else if (error.code === 'P2003') {
        throw new BadRequestException('Cannot delete category: it has related items');
      }
      throw new BadRequestException(error.message || 'Failed to delete category');
    }
  }

  async getMedicinesByCategory(categoryId: number) {
    try {
      return await this.prisma.inventory.findMany({
        where: { category_id: categoryId },
        // include: {
        //   category: true
        // }
      });
    } catch (error) {
      console.error('Error fetching medicines by category:', error);
      throw new BadRequestException('Failed to fetch medicines by category');
    }
  }
}