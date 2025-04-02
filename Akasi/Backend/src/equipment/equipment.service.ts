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
        ]
      });
      
      return equipment;
    } catch (error) {
      throw new BadRequestException('Failed to fetch equipment items');
    }
  }

  async addItem(item: any, admin_id?: number) {
    try {
      // Check if equipment with the same name already exists
      const existingEquipment = await this.prisma.equipment.findFirst({
        where: {
          equipName: item.name
        }
      });

      if (existingEquipment) {
        throw new BadRequestException('Equipment with this name already exists');
      }

      // Optional expiration date handling
      let expirationDate = null;
      if (item.expirationDate) {
        expirationDate = new Date(item.expirationDate);
      }

      // Create new equipment
      const result = await this.prisma.equipment.create({
        data: {
          equipName: item.name,
          count: Number(item.count),
          unit: item.unit,
          expiration: expirationDate
        }
      });

      // Log the new equipment addition with admin_id
      await this.prisma.editsEquipment.create({
        data: {
          equip_id: result.equip_id,
          equipName: result.equipName, // Include equipment name
          date: new Date(),
          cause: 'Initial inventory',
          addSubCount: Number(item.count),
          runningTotal: Number(item.count), // Add initial running total
          admin_id: admin_id || null
        }
      });

      return result;
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to add equipment item');
    }
  }

  async updateItem(id: number, data: any, admin_id?: number) {
    try {
      // Validate if equipment exists
      const equipment = await this.prisma.equipment.findUnique({
        where: { equip_id: id }
      });

      if (!equipment) {
        throw new BadRequestException('Equipment not found');
      }

      // Optional expiration date handling
      let expirationDate = null;
      if (data.expirationDate) {
        expirationDate = new Date(data.expirationDate);
      }

      // Calculate the change in count
      const countDifference = Number(data.count) - equipment.count;

      // Update equipment
      const updatedEquipment = await this.prisma.equipment.update({
        where: { equip_id: id },
        data: {
          equipName: data.name,
          count: Number(data.count),
          unit: data.unit,
          expiration: expirationDate
        }
      });

      // Log the update if count changed
      if (countDifference !== 0) {
        // Calculate the new total
        const newTotal = Number(data.count);
        
        await this.prisma.editsEquipment.create({
          data: {
            equip_id: id,
            equipName: updatedEquipment.equipName, // Include equipment name
            date: new Date(),
            cause: 'Manual update',
            addSubCount: countDifference,
            runningTotal: newTotal, // Add running total
            admin_id: admin_id || null
          }
        });
      }

      return updatedEquipment;
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to update equipment');
    }
  }

  async deleteItem(id: number, admin_id?: number) {
    try {
      // Validate if equipment exists
      const equipment = await this.prisma.equipment.findUnique({
        where: { equip_id: id }
      });

      if (!equipment) {
        throw new BadRequestException('Equipment not found');
      }

      // Log the deletion before deleting
      await this.prisma.editsEquipment.create({
        data: {
          equip_id: id,
          equipName: equipment.equipName, // Include equipment name
          date: new Date(),
          cause: 'Equipment deleted',
          addSubCount: -equipment.count, // Record removal of all items
          runningTotal: 0, // After deletion, total is 0
          admin_id: admin_id || null
        }
      });

      // Delete equipment
      await this.prisma.equipment.delete({
        where: { equip_id: id }
      });

      return { message: 'Equipment deleted successfully' };
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to delete equipment');
    }
  }

  async increaseEquipment(equip_id: number, quantity: number, cause: string = 'Unspecified addition', admin_id?: number) {
    try {
      const equipment = await this.prisma.equipment.findUnique({
        where: { equip_id }
      });

      if (!equipment) {
        throw new BadRequestException('Equipment not found');
      }

      // Update the equipment count
      const updatedEquipment = await this.prisma.equipment.update({
        where: { equip_id },
        data: { count: equipment.count + quantity }
      });

      // Calculate new running total
      const newTotal = equipment.count + quantity;

      // Log the change
      await this.prisma.editsEquipment.create({
        data: {
          equip_id,
          equipName: updatedEquipment.equipName,
          date: new Date(),
          cause,
          addSubCount: quantity,
          runningTotal: newTotal, // Add running total
          admin_id
        }
      });

      return updatedEquipment;
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to increase equipment');
    }
  }

  async decreaseEquipment(equip_id: number, quantity: number, cause: string = 'Unspecified reduction', admin_id?: number) {
    try {
      const equipment = await this.prisma.equipment.findUnique({
        where: { equip_id }
      });

      if (!equipment) {
        throw new BadRequestException('Equipment not found');
      }

      if (equipment.count < quantity) {
        throw new BadRequestException(`Insufficient equipment. Available: ${equipment.count}`);
      }

      // Update the equipment count
      const updatedEquipment = await this.prisma.equipment.update({
        where: { equip_id },
        data: { count: equipment.count - quantity }
      });

      // Calculate new running total
      const newTotal = equipment.count - quantity;

      // Log the change
      await this.prisma.editsEquipment.create({
        data: {
          equip_id,
          equipName: updatedEquipment.equipName,
          date: new Date(),
          cause,
          addSubCount: -quantity, // Negative for reduction
          runningTotal: newTotal, // Add running total
          admin_id
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
          admin: {
            select: {
              name: true,
              username: true
            }
          }
        },
        orderBy: {
          date: 'desc'
        }
      });
      
      // Format the edits to include admin info and unit
      const formattedEdits = edits.map(edit => ({
        ...edit,
        equipName: edit.equipment?.equipName || edit.equipName,
        unit: edit.equipment?.unit || '',
        adminInfo: edit.admin
          ? `${edit.admin.name} (${edit.admin.username})`
          : 'No admin info'
      }));
      
      return {
        edits: formattedEdits
      };
    } catch (error) {
      throw new BadRequestException('Failed to fetch equipment edits');
    }
  }
}
