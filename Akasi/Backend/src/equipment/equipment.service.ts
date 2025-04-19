import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class EquipmentService {
  constructor(private prisma: PrismaService) {}

  async getAllItems() {
    try {
      const equipment = await this.prisma.equipment.findMany({
        orderBy: [
          { equipName: 'asc' },
        ],
        include: {
          category: true // Include category information
        }
      });
      
      return equipment;
    } catch (error) {
      throw new BadRequestException('Failed to fetch equipment items');
    }
  }

  async addItem(item: any, nurse_id?: number) {
    try {
      // Check if equipment with the same name already exists
      const existingEquipment = await this.prisma.equipment.findFirst({
        where: {
          equipName: item.equipName || item.name  // Check both possible property names
        }
      });

      if (existingEquipment) {
        throw new BadRequestException('Equipment with this name already exists');
      }

      // Optional expiration date handling
      let expirationDate = null;
      if (item.expirationDate || item.expiration) {
        expirationDate = new Date(item.expirationDate || item.expiration);
      }

      // Create new equipment
      const result = await this.prisma.equipment.create({
        data: {
          equipName: item.equipName || item.name,  // Use either property name
          count: Number(item.count),
          unit: item.unit,
          expiration: expirationDate,
          equipCategory_id: item.categoryId || item.equipCategory_id || 1  // Check all possible property names
        }
      });

      // Log the new equipment addition with nurse_id
      await this.prisma.editsEquipment.create({
        data: {
          equipment_id: result.equipment_id,
          equipName: result.equipName,
          date: new Date(),
          cause: 'Initial inventory',
          addSubCount: Number(item.count),
          runningTotal: Number(item.count),
          nurse_id: nurse_id || 1, // Ensure we have a valid nurse_id
          category_id: result.equipCategory_id // Add category ID
        }
      });

      return result;
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to add equipment item');
    }
  }

  async updateItem(id: number, data: any, nurse_id?: number) {
    try {
      // Validate if equipment exists
      const equipment = await this.prisma.equipment.findUnique({
        where: { equipment_id: id }
      });

      if (!equipment) {
        throw new BadRequestException('Equipment not found');
      }

      // Optional expiration date handling
      let expirationDate = null;
      if (data.expirationDate || data.expiration) {
        expirationDate = new Date(data.expirationDate || data.expiration);
      }

      // Calculate the change in count
      const countDifference = Number(data.count) - equipment.count;

      // Update equipment with proper property handling
      const updatedEquipment = await this.prisma.equipment.update({
        where: { equipment_id: id },
        data: {
          equipName: data.equipName || data.name,
          count: Number(data.count),
          unit: data.unit,
          expiration: expirationDate,
          equipCategory_id: data.categoryId || data.equipCategory_id || equipment.equipCategory_id
        }
      });

      // Log the update if count changed
      if (countDifference !== 0) {
        // Calculate the new total
        const newTotal = Number(data.count);
        
        await this.prisma.editsEquipment.create({
          data: {
            equipment_id: id,
            equipName: updatedEquipment.equipName,
            date: new Date(),
            cause: 'Manual update',
            addSubCount: countDifference,
            runningTotal: newTotal,
            nurse_id: nurse_id || 1,
            category_id: updatedEquipment.equipCategory_id
          }
        });
      }

      return updatedEquipment;
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to update equipment');
    }
  }

  async deleteItem(id: number, nurse_id?: number) {
    try {
      // Validate if equipment exists
      const equipment = await this.prisma.equipment.findUnique({
        where: { equipment_id: id }
      });

      if (!equipment) {
        throw new BadRequestException('Equipment not found');
      }

      // Log the deletion before deleting
      await this.prisma.editsEquipment.create({
        data: {
          equipment_id: id,
          equipName: equipment.equipName,
          date: new Date(),
          cause: 'Equipment deleted',
          addSubCount: -equipment.count,
          runningTotal: 0,
          nurse_id: nurse_id || 1, // Ensure we have a valid nurse_id
          category_id: equipment.equipCategory_id
        }
      });

      // Delete equipment
      await this.prisma.equipment.delete({
        where: { equipment_id: id }
      });

      return { message: 'Equipment deleted successfully' };
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to delete equipment');
    }
  }

  async increaseEquipment(equipment_id: number, quantity: number, cause: string = 'Unspecified addition', nurse_id?: number) {
    try {
      const equipment = await this.prisma.equipment.findUnique({
        where: { equipment_id }
      });

      if (!equipment) {
        throw new BadRequestException('Equipment not found');
      }

      // Update the equipment count
      const updatedEquipment = await this.prisma.equipment.update({
        where: { equipment_id },
        data: { count: equipment.count + quantity }
      });

      // Calculate new running total
      const newTotal = equipment.count + quantity;

      // Log the change
      await this.prisma.editsEquipment.create({
        data: {
          equipment_id,
          equipName: updatedEquipment.equipName,
          date: new Date(),
          cause,
          addSubCount: quantity,
          runningTotal: newTotal,
          nurse_id: nurse_id || 1, // Ensure we have a valid nurse_id
          category_id: equipment.equipCategory_id
        }
      });

      return updatedEquipment;
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to increase equipment');
    }
  }

  async decreaseEquipment(equipment_id: number, quantity: number, cause: string = 'Unspecified reduction', nurse_id?: number) {
    try {
      const equipment = await this.prisma.equipment.findUnique({
        where: { equipment_id }
      });

      if (!equipment) {
        throw new BadRequestException('Equipment not found');
      }

      if (equipment.count < quantity) {
        throw new BadRequestException(`Insufficient equipment. Available: ${equipment.count}`);
      }

      // Update the equipment count
      const updatedEquipment = await this.prisma.equipment.update({
        where: { equipment_id },
        data: { count: equipment.count - quantity }
      });

      // Calculate new running total
      const newTotal = equipment.count - quantity;

      // Log the change
      await this.prisma.editsEquipment.create({
        data: {
          equipment_id,
          equipName: updatedEquipment.equipName,
          date: new Date(),
          cause,
          addSubCount: -quantity,
          runningTotal: newTotal,
          nurse_id: nurse_id || 1, // Ensure we have a valid nurse_id
          category_id: equipment.equipCategory_id
        }
      });

      return updatedEquipment;
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to decrease equipment');
    }
  }

  async getEquipmentEdits() {
    try {
      // Get all equipment edit records with joined equipment and admin data
      const edits = await this.prisma.editsEquipment.findMany({
        include: {
          equipment: {
            select: {
              equipName: true,
              unit: true
            }
          },
          nurse: {
            select: {
              name: true,
              username: true
            }
          },
          category: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          date: 'desc'
        }
      });
      
      // Format the edits to include nurse info and unit
      const formattedEdits = edits.map(edit => ({
        ...edit,
        equipName: edit.equipment?.equipName || edit.equipName,
        unit: edit.equipment?.unit || '',
        categoryName: edit.category?.name || 'Uncategorized',
        nurseInfo: edit.nurse
          ? `${edit.nurse.name} (${edit.nurse.username})`
          : 'No nurse info'
      }));
      
      return {
        edits: formattedEdits
      };
    } catch (error) {
      throw new BadRequestException('Failed to fetch equipment edits');
    }
  }

  async getAllCategories() {
    try {
      return await this.prisma.equipmentCategory.findMany();
    } catch (error) {
      throw new BadRequestException('Failed to fetch equipment categories');
    }
  }

  async addCategory(categoryData: { name: string; }, nurse_id: any) {
    try {
      const newCategory = await this.prisma.equipmentCategory.create({
        data: {
          name: categoryData.name
        }
      });

      return newCategory;
    } catch (error) {
      throw new BadRequestException('Failed to add equipment category');
    }
  }

  async updateCategory(id: number, name: string, nurse_id: any) {
    try {
      // Get old category info before updating
      const oldCategory = await this.prisma.equipmentCategory.findUnique({
        where: { equipCategory_id: id }
      });
      
      if (!oldCategory) {
        throw new BadRequestException('Equipment category not found');
      }

      // Update category
      const updatedCategory = await this.prisma.equipmentCategory.update({
        where: { equipCategory_id: id },
        data: { name }
      });

      return updatedCategory;
    } catch (error) {
      console.error('Category update error:', error);
      throw new BadRequestException('Failed to update equipment category');
    }
  }

  async deleteCategory(id: number, nurse_id: any) {
    try {
      // First check if there are any equipment items using this category
      const equipmentCount = await this.prisma.equipment.count({
        where: { equipCategory_id: id }
      });

      if (equipmentCount > 0) {
        throw new BadRequestException('Cannot delete category: it has related equipment items');
      }

      // Then, delete the category itself
      return await this.prisma.equipmentCategory.delete({
        where: { equipCategory_id: id }
      });
    } catch (error) {
      console.error('Error deleting equipment category:', error);
      if (error.code === 'P2025') {
        throw new BadRequestException('Equipment category not found');
      } 
      throw new BadRequestException(error.message || 'Failed to delete equipment category');
    }
  }
}
