import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async getAllItems() {
    try {
      // Fetch all items
      const items = await this.prisma.inventory.findMany({
        include: {
          category: true
        }
      });
      
      // Group items by category
      const categorizedItems: Record<string, typeof items> = items.reduce((acc: Record<string, typeof items>, item) => {
        const categoryId = item.category_id;
        if (!acc[categoryId]) {
          acc[categoryId] = [];
        }
        acc[categoryId].push(item);
        return acc;
      }, {});
      
      // Sort each category's items by expiration date
      Object.keys(categorizedItems).forEach(categoryId => {
        categorizedItems[categoryId].sort((a, b) => {
          if (!a.expiration) return 1;
          if (!b.expiration) return -1;
          return new Date(a.expiration).getTime() - new Date(b.expiration).getTime();
        });
      });
      
      // Flatten back to array
      let sortedItems: typeof items = [];
      Object.values(categorizedItems).forEach(categoryItems => {
        sortedItems = [...sortedItems, ...categoryItems];
      });
      
      return sortedItems;
    } catch (error) {
      throw new BadRequestException('Failed to fetch inventory items');
    }
  }

  async addItem(item: any, admin_id?: number) {
    try {
      // Validate expiration date isn't in the past
      if (item.expirationDate) {
        const expirationDate = new Date(item.expirationDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (expirationDate < today) {
          throw new BadRequestException('Expiration date cannot be in the past');
        }
      }

      // Check if the medicine already exists
      const existingMedicine = await this.prisma.inventory.findFirst({
        where: {
          medName: item.name,
          expiration: item.expirationDate ? new Date(item.expirationDate) : null,
        },
      });

      if (existingMedicine) {
        // If batch exists, increase its count with tracking
        return await this.increaseInventory(
          existingMedicine.med_id,
          existingMedicine.medName,
          item.count,
          'New batch added',
          admin_id
        );
      }

      // Add a new batch under the same medicine name
      const result = await this.prisma.inventory.create({
        data: {
          medName: item.name,
          expiration: item.expirationDate ? new Date(item.expirationDate) : null,
          count: Number(item.count),
          category_id: Number(item.category_id),
        },
        include: {
          category: true,
        },
      });

      // Log the new item addition with running total
      await this.prisma.editsInverntory.create({
        data: {
          med_id: result.med_id,
          medName: result.medName,
          date: new Date(),
          cause: 'Initial inventory',
          addSubCount: Number(item.count),
          runningTotal: Number(item.count), // Initial count is the running total
          category_id: Number(item.category_id),
          admin_id: admin_id || null
        }
      });

      return result;
    } catch (error) {
      console.error('Error adding inventory item:', error);
      throw new BadRequestException(error.message || 'Failed to add inventory item');
    }
  }

  async updateItem(med_id: number, medName: string, data: any, admin_id: any) {
    try {
      // Validate expiration date isn't in the past
      if (data.expirationDate) {
        const expirationDate = new Date(data.expirationDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (expirationDate < today) {
          throw new BadRequestException('Expiration date cannot be in the past');
        }
      }

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
      throw new BadRequestException(error.message || 'Failed to update inventory item');
    }
  }

  async deleteItem(med_id: number, medName: string, admin_id: any) {
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

  async deleteGroupByName(medName: string, admin_id: any) {
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

  async reduceInventory(med_id: number, medName: string, quantity: number, cause: string = 'Unspecified reduction', admin_id?: number) {
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

      // Calculate new running total
      const newTotal = item.count - quantity;

      // Log the change to EditsInverntory with running total
      await this.prisma.editsInverntory.create({
        data: {
          med_id: med_id,
          medName: medName,
          date: new Date(),
          cause: cause,
          addSubCount: -quantity, // Negative for reduction
          runningTotal: newTotal, // Include running total
          category_id: item.category_id, // Include category
          admin_id: admin_id || null
        }
      });

      return updatedItem;
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to reduce inventory');
    }
  }

  async increaseInventory(med_id: number, medName: string, quantity: number, cause: string = 'Unspecified addition', admin_id?: number) {
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

      // Calculate new running total
      const newTotal = item.count + quantity;

      // Log the change to EditsInverntory with running total
      await this.prisma.editsInverntory.create({
        data: {
          med_id: med_id,
          medName: medName,
          date: new Date(),
          cause: cause,
          addSubCount: quantity, // Positive for addition
          runningTotal: newTotal, // Include running total
          category_id: item.category_id, // Include category
          admin_id: admin_id || null
        }
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

  async addCategory(categoryData: { name: string; }, admin_id: any) {
    try {
      const newCategory = await this.prisma.medicineCategory.create({
        data: {
          name: categoryData.name
        }
      });

      return newCategory;
    } catch (error) {
      throw new BadRequestException('Failed to add category');
    }
  }

  async updateCategory(id: number, name: string, admin_id: any) {
    try {
      // Get old category info before updating
      const oldCategory = await this.prisma.medicineCategory.findUnique({
        where: { category_id: id }
      });
      
      if (!oldCategory) {
        throw new BadRequestException('Category not found');
      }

      // Update category
      const updatedCategory = await this.prisma.medicineCategory.update({
        where: { category_id: id },
        data: { name }
      });

      return updatedCategory;
    } catch (error) {
      throw new BadRequestException('Failed to update category');
    }
  }

  async deleteCategory(id: number, admin_id: any) {
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
      });
    } catch (error) {
      console.error('Error fetching medicines by category:', error);
      throw new BadRequestException('Failed to fetch medicines by category');
    }
  }

  async updateMedicineName(oldName: string, newName: string, categoryId: number, admin_id?: number) {
    try {
      // Get all medicine batches with this name
      const medicineBatches = await this.prisma.inventory.findMany({
        where: { 
          medName: oldName,
          category_id: categoryId
        }
      });

      if (medicineBatches.length === 0) {
        throw new BadRequestException('Medicine not found');
      }

      // Update all batches to the new name
      const updatePromises = medicineBatches.map(batch => 
        this.prisma.inventory.update({
          where: { 
            med_id_medName: {
              med_id: batch.med_id,
              medName: batch.medName
            }
          },
          data: { 
            medName: newName 
          }
        })
      );

      // Execute all updates
      await Promise.all(updatePromises);

      // Create a record for the name change using the first batch
      const firstBatch = medicineBatches[0];
      
      await this.prisma.editsInverntory.create({
        data: {
          med_id: firstBatch.med_id,
          medName: newName, // Use the new name since the record has been updated
          date: new Date(),
          cause: `Medicine renamed from "${oldName}" to "${newName}"`,
          addSubCount: 0, // No quantity change
          runningTotal: firstBatch.count, // Current count remains the same
          category_id: categoryId,
          admin_id: admin_id || null
        }
      });

      return { 
        success: true, 
        message: `Updated ${medicineBatches.length} batches from "${oldName}" to "${newName}"` 
      };
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to update medicine name');
    }
  }

  async getInventoryEdits(admin_id: any) {
    try {
      // Get all edit records with joined inventory, admin and category data
      const edits = await this.prisma.editsInverntory.findMany({
        include: {
          inventory: {
            select: {
              expiration: true
            }
          },
          admin: {
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
      
      // Format the edits to include expiration date, admin info, and category
      const formattedEdits = edits.map(edit => ({
        ...edit,
        batchInfo: edit.inventory?.expiration
          ? new Date(edit.inventory.expiration).toISOString().split('T')[0]
          : 'No batch info',
        adminInfo: edit.admin
          ? `${edit.admin.name} (${edit.admin.username})`
          : 'No admin info',
        categoryName: edit.category.name || 'Unknown Category'
      }));
      
      return {
        edits: formattedEdits
      };
    } catch (error) {
      throw new BadRequestException('Failed to fetch inventory edits');
    }
  }

  /**
   * Log medicine dispensing from consultation
   */
  async logConsultationDispensing(
    med_id: number, 
    medName: string, 
    quantity: number, 
    consultationId: number, 
    patientName: string,
    admin_id?: number
  ) {
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

      // Calculate new running total
      const newTotal = item.count - quantity;

      // Log the dispensing to EditsInverntory with running total
      await this.prisma.editsInverntory.create({
        data: {
          med_id: med_id,
          medName: medName,
          date: new Date(),
          cause: `Dispensed to patient ${patientName} (Consultation #${consultationId})`,
          addSubCount: -quantity, // Negative for dispensing
          runningTotal: newTotal, // Include running total
          category_id: item.category_id, // Include category
          admin_id: admin_id || null
        }
      });

      return updatedItem;
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to log dispensing');
    }
  }
}