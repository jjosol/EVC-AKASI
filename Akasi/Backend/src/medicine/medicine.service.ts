import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class MedicineService {
  constructor(private prisma: PrismaService) {}

  async getAllItems() {
    try {
      // Fetch all items
      const items = await this.prisma.medicine.findMany({
        include: {
          category: true
        }
      });
      
      // Group items by category
      const categorizedItems: Record<string, typeof items> = items.reduce((acc: Record<string, typeof items>, item) => {
        const categoryId = item.medCategory_id;
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
      throw new BadRequestException('Failed to fetch medicine items');
    }
  }

  async addItem(item: any, nurse_id?: number) {
    try {
      // Make sure to explicitly handle the otc flag
      const otc = item.otc !== undefined ? item.otc : true; // Default to true if not provided

      // Validate expiration date isn't in the past
      if (item.expirationDate || item.expiration) {
        const expirationDate = new Date(item.expirationDate || item.expiration);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (expirationDate < today) {
          throw new BadRequestException('Expiration date cannot be in the past');
        }
      }

      // Log the incoming OTC value for debugging
      console.log('Received OTC value:', item.isOTC, typeof item.isOTC);
      
      // Log the incoming item data for debugging
      console.log('Received item data:', item);

      // Extract medication name - be flexible with property names
      const medName = item.medName || item.name;
      
      // Handle expiration date carefully - check both possible field names
      const expirationDate = item.expiration ? 
        new Date(item.expiration) : 
        (item.expirationDate ? new Date(item.expirationDate) : null);
      
      if (!medName) {
        throw new BadRequestException('Medicine name is required');
      }

      // Check if the medicine already exists
      const existingMedicine = await this.prisma.medicine.findFirst({
        where: {
          medName: medName,
          ...(expirationDate && { expiration: expirationDate })
        },
      });

      if (existingMedicine) {
        // If batch exists, increase its count with tracking
        return await this.increaseInventory(
          existingMedicine.medicine_id,
          existingMedicine.medName,
          item.count,
          'New batch added',
          nurse_id
        );
      }

      // Fix the OTC conversion
      const otcValue = typeof item.isOTC === 'boolean' ? item.isOTC : 
                      (item.otc !== undefined ? item.otc : true);
      
      console.log('Processing OTC value:', otcValue, typeof otcValue);
      
      // Add a new batch under the same medicine name with OTC flag
      const result = await this.prisma.medicine.create({
        data: {
          medName: item.medName || item.name, // Use either medName or name property
          expiration: expirationDate, // Use the properly processed expiration date
          count: Number(item.count),
          medCategory_id: Number(item.medCategory_id || item.category_id), // Handle both field names
          otc: otcValue,  // Use the properly converted boolean value
        },
        include: {
          category: true,
        },
      });

      // Log the new item addition with running total
      await this.prisma.editsMedicine.create({
        data: {
          med_id: result.medicine_id,
          medName: result.medName,
          date: new Date(),
          cause: 'Initial inventory',
          addSubCount: Number(item.count),
          runningTotal: Number(item.count),
          category_id: Number(item.medCategory_id || item.category_id), // Handle both field names
          nurse_id: nurse_id || null,
        }
      });

      return result;
    } catch (error) {
      console.error('Error adding medicine item:', error);
      throw new BadRequestException(error.message || 'Failed to add medicine item');
    }
  }

  async updateItem(med_id: number, medName: string, data: any, nurse_id: any) {
    try {
      // Validate expiration date isn't in the past
      if (data.expirationDate || data.expiration) {
        const expirationDate = new Date(data.expirationDate || data.expiration);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (expirationDate < today) {
          throw new BadRequestException('Expiration date cannot be in the past');
        }
      }
      
      // Log the incoming OTC value for debugging
      console.log('Update OTC value:', data.isOTC, typeof data.isOTC);
      console.log('Processed isOTC value:', data.isOTC, typeof data.isOTC);

      // Fix the OTC conversion
      const otcValue = typeof data.isOTC === 'boolean' ? data.isOTC : 
                     (data.otc !== undefined ? data.otc : true);
      
      console.log('Processing OTC value:', otcValue, typeof otcValue);

      // Process expiration date - check both possible field names
      const expirationDate = data.expiration ? 
        new Date(data.expiration) : 
        (data.expirationDate ? new Date(data.expirationDate) : null);

      // If name is different, create new entry and delete old one
      if (medName !== data.name) {
        const newItem = await this.prisma.medicine.create({
          data: {
            medName: data.name,
            expiration: expirationDate, // Use consistently processed date
            count: Number(data.count),
            medCategory_id: Number(data.medCategory_id || data.category_id),
            otc: otcValue, 
          },
          include: {
            category: true,
          },
        });
        // Delete old entry
        await this.prisma.medicine.delete({
          where: {
            medicine_id_medName: {
              medicine_id: med_id,
              medName
            }
          }
        });
        return newItem;
      }

      // If name is same, just update
      return await this.prisma.medicine.update({
        where: {
          medicine_id_medName: {
            medicine_id: med_id,
            medName
          }
        },
        data: {
          expiration: expirationDate, // Use consistently processed date
          count: Number(data.count),
          medCategory_id: Number(data.medCategory_id || data.category_id),
          otc: otcValue,  // Use the properly converted boolean value
        },
        include: {
          category: true
        }
      });
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to update medicine item');
    }
  }

  async deleteItem(med_id: number, medName: string, nurse_id: any) {
    try {
      const result = await this.prisma.medicine.delete({
        where: {
          medicine_id_medName: {
            medicine_id: med_id,
            medName
          }
        }
      });
      return result;
    } catch (error) {
      throw new BadRequestException('Failed to delete medicine item');
    }
  }

  async deleteGroupByName(medName: string, nurse_id: any) {
    try {
      const result = await this.prisma.medicine.deleteMany({
        where: {
          medName: medName
        }
      });
      return result;
    } catch (error) {
      throw new BadRequestException('Failed to delete medicine group');
    }
  }

  async reduceInventory(med_id: number, medName: string, quantity: number, cause: string = 'Unspecified reduction', nurse_id?: number) {
    try {
      // Find the inventory item by med_id and medName
      const item = await this.prisma.medicine.findUnique({
        where: { medicine_id_medName: { medicine_id: med_id, medName } }
      });

      if (!item) {
        throw new BadRequestException('Item not found');
      }

      if (item.count < quantity) {
        throw new BadRequestException('Insufficient inventory');
      }

      // Update the inventory count
      const updatedItem = await this.prisma.medicine.update({
        where: { medicine_id_medName: { medicine_id: med_id, medName } },
        data: { count: item.count - quantity }
      });

      // Calculate new running total
      const newTotal = item.count - quantity;

      // Log the change to EditsMedicine with running total
      await this.prisma.editsMedicine.create({
        data: {
          med_id: med_id,
          medName: medName,
          date: new Date(),
          cause: cause,
          addSubCount: -quantity, // Negative for reduction
          runningTotal: newTotal, // Include running total
          category_id: item.medCategory_id, // Include category
          nurse_id: nurse_id || null
        }
      });

      return updatedItem;
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to reduce inventory');
    }
  }

  async increaseInventory(med_id: number, medName: string, quantity: number, cause: string = 'Unspecified addition', nurse_id?: number) {
    try {
      // Find the inventory item by med_id and medName
      const item = await this.prisma.medicine.findUnique({
        where: { medicine_id_medName: { medicine_id: med_id, medName } }
      });

      if (!item) {
        throw new BadRequestException('Item not found');
      }

      // Update the inventory count
      const updatedItem = await this.prisma.medicine.update({
        where: { medicine_id_medName: { medicine_id: med_id, medName } },
        data: { count: item.count + quantity }
      });

      // Calculate new running total
      const newTotal = item.count + quantity;

      // Log the change to EditsMedicine with running total
      await this.prisma.editsMedicine.create({
        data: {
          med_id: med_id,
          medName: medName,
          date: new Date(),
          cause: cause,
          addSubCount: quantity, // Positive for addition
          runningTotal: newTotal, // Include running total
          category_id: item.medCategory_id, // Include category
          nurse_id: nurse_id || null
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

  async addCategory(categoryData: { name: string; }, nurse_id: any) {
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

  async updateCategory(id: number, name: string, nurse_id: any) {
    try {
      console.log('Updating category:', { id, name }); // Add debugging
      
      // Get old category info before updating
      const oldCategory = await this.prisma.medicineCategory.findUnique({
        where: { medCategory_id: id }
      });
      
      if (!oldCategory) {
        throw new BadRequestException('Category not found');
      }

      // Update category - ensure proper schema
      const updatedCategory = await this.prisma.medicineCategory.update({
        where: { medCategory_id: id },
        data: { name }
      });

      return updatedCategory;
    } catch (error) {
      console.error('Category update error:', error);
      throw new BadRequestException('Failed to update category');
    }
  }

  async deleteCategory(id: number, nurse_id: any) {
    try {
      // First, delete all inventory items associated with this category
      await this.prisma.medicine.deleteMany({
        where: { medCategory_id: id }
      });

      // Then, delete the category itself
      return await this.prisma.medicineCategory.delete({
        where: { medCategory_id: id }
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
      return await this.prisma.medicine.findMany({
        where: { medCategory_id: categoryId },
      });
    } catch (error) {
      console.error('Error fetching medicines by category:', error);
      throw new BadRequestException('Failed to fetch medicines by category');
    }
  }

  async updateMedicineName(oldName: string, newName: string, categoryId: number, nurse_id?: number) {
    try {
      const numericCategoryId = Number(categoryId);

      // Get all medicine batches with this name
      const medicineBatches = await this.prisma.medicine.findMany({
        where: { 
          medName: oldName,
          medCategory_id: numericCategoryId 
        }
      });

      if (medicineBatches.length === 0) {
        throw new BadRequestException('Medicine not found');
      }

      // Use a transaction to ensure all updates happen together
      await this.prisma.$transaction(async (prisma) => {
        // 1. Update medicine name in inventory records
        for (const batch of medicineBatches) {
          await prisma.medicine.update({
            where: { 
              medicine_id_medName: {
                medicine_id: batch.medicine_id,
                medName: batch.medName
              }
            },
            data: { 
              medName: newName 
            }
          });
        }

        // 2. Update all references in EditsMedicine table
        await prisma.editsMedicine.updateMany({
          where: {
            medName: oldName,
            category_id: numericCategoryId
          },
          data: {
            medName: newName
          }
        });
      });

      return { 
        success: true, 
        message: `Updated ${medicineBatches.length} batches from "${oldName}" to "${newName}"` 
      };
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to update medicine name');
    }
  }

  async getInventoryEdits(nurse_id: any) {
    try {
      // Get all edit records with joined inventory, nurse and category data
      const edits = await this.prisma.editsMedicine.findMany({
        include: {
          medicine: {
            select: {
              expiration: true
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
      
      // Format the edits to include expiration date, nurse info, and category
      const formattedEdits = edits.map(edit => ({
        ...edit,
        batchInfo: edit.medicine?.expiration
          ? new Date(edit.medicine.expiration).toISOString().split('T')[0]
          : 'No batch info',
        nurseInfo: edit.nurse
          ? `${edit.nurse.name} (${edit.nurse.username})`
          : 'No nurse info',
        categoryName: edit.category.name || 'Unknown Category'
      }));
      
      return {
        edits: formattedEdits
      };
    } catch (error) {
      throw new BadRequestException('Failed to fetch medicine edits');
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
    nurse_id?: number
  ) {
    try {
      // Find the inventory item by med_id and medName
      const item = await this.prisma.medicine.findUnique({
        where: { medicine_id_medName: { medicine_id: med_id, medName } }
      });

      if (!item) {
        throw new BadRequestException('Item not found');
      }

      if (item.count < quantity) {
        throw new BadRequestException('Insufficient inventory');
      }

      // Update the inventory count
      const updatedItem = await this.prisma.medicine.update({
        where: { medicine_id_medName: { medicine_id: med_id, medName } },
        data: { count: item.count - quantity }
      });

      // Calculate new running total
      const newTotal = item.count - quantity;

      // Log the dispensing to EditsMedicine with running total
      await this.prisma.editsMedicine.create({
        data: {
          med_id: med_id,
          medName: medName,
          date: new Date(),
          cause: `Dispensed to patient ${patientName} (Consultation #${consultationId})`,
          addSubCount: -quantity, // Negative for dispensing
          runningTotal: newTotal, // Include running total
          category_id: item.medCategory_id, // Include category
          nurse_id: nurse_id || null
        }
      });

      return updatedItem;
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to log dispensing');
    }
  }

  async getOtcStatus(med_id: number, medName: string) {
    try {
      const medicine = await this.prisma.medicine.findFirst({
        where: {
          medicine_id: med_id,
          medName: medName
        },
        select: {
          otc: true
        }
      });
      
      if (!medicine) {
        throw new NotFoundException(`Medicine with ID ${med_id} and name ${medName} not found`);
      }
      
      return { otc: medicine.otc };
    } catch (error) {
      throw new InternalServerErrorException(`Failed to get OTC status: ${error.message}`);
    }
  }
}