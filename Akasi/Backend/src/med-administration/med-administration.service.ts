// med-administration.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { MedicineService } from '../medicine/medicine.service'; // Fixed import

@Injectable()
export class MedAdministrationService {
  constructor(
    private prisma: PrismaService,
    private medicineService: MedicineService // Fixed service name
  ) {}

  async getMedAdministrationByConsultation(consultationId: number) {
    try {
      return await this.prisma.medAdministration.findMany({
        where: { consultation_id: consultationId },
        include: { medicine: true } // This is correct based on schema
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

        // 2. Check medicine availability
        const medicine = await prisma.medicine.findFirst({
          where: {
            medicine_id: data.med_id,
            medName: data.medName,
          },
        });

        if (!medicine) {
          throw new BadRequestException('Medicine not found in inventory');
        }

        if (medicine.count < data.count) {
          throw new BadRequestException(`Insufficient inventory. Available: ${medicine.count}`);
        }

        // 3. Use medicineService.reduceInventory with nurse_id
        await this.medicineService.reduceInventory(
          data.med_id,
          data.medName,
          data.count,
          `Dispensed to ${data.patient_name} in consultation #${data.consultation_id}`,
          data.nurse_id // Pass the nurse_id
        );

        // 4. Create new med administration record
        return await prisma.medAdministration.create({
          data: {
            consultation_id: data.consultation_id,
            patient_id: data.patient_id,
            nurse_id: data.nurse_id,
            doctor_id: data.doctor_id,
            med_id: data.med_id,
            medName: data.medName,
            count: data.count,
            schedule: data.schedule,
            start_date: new Date(data.start_date),
            end_date: new Date(data.end_date),
            date: new Date(), // Use current date
            patient_name: data.patient_name,
            remarks: data.remarks || null,
            intervention: data.intervention || null,
          },
        });
      } catch (error) {
        throw new BadRequestException(error.message);
      }
    });
  }

  async updateMedAdministration(id: number, data: any, nurse_id?: number) {
    return await this.prisma.$transaction(async (prisma) => {
      try {
        // Find by med_administration_id
        const currentRecord = await prisma.medAdministration.findUnique({
          where: { med_administration_id: id }
        });

        if (!currentRecord) {
          throw new BadRequestException('Record not found');
        }

        const quantityDiff = data.count - currentRecord.count;

        if (quantityDiff !== 0) {
          const medicine = await prisma.medicine.findFirst({
            where: {
              medicine_id: currentRecord.med_id,
              medName: currentRecord.medName
            }
          });

          if (!medicine) {
            throw new BadRequestException('Medicine item not found');
          }

          if (quantityDiff > 0 && medicine.count < quantityDiff) {
            throw new BadRequestException('Insufficient inventory');
          }

          // Use medicineService instead of direct update for proper tracking
          if (quantityDiff > 0) {
            // Need to take more medication from inventory
            await this.medicineService.reduceInventory(
              currentRecord.med_id,
              currentRecord.medName,
              quantityDiff,
              `Increased quantity for med administration #${id}, Patient: ${currentRecord.patient_name}`,
              nurse_id || currentRecord.nurse_id
            );
          } else {
            // Return medication to inventory
            await this.medicineService.increaseInventory(
              currentRecord.med_id,
              currentRecord.medName,
              Math.abs(quantityDiff),
              `Decreased quantity for med administration #${id}, Patient: ${currentRecord.patient_name}`,
              nurse_id || currentRecord.nurse_id
            );
          }
        }

        return await prisma.medAdministration.update({
          where: { med_administration_id: id },
          data,
          include: {
            medicine: true // Changed from inventory to medicine
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
        // Find by med_administration_id
        const record = await prisma.medAdministration.findUnique({
          where: { med_administration_id: id }
        });

        if (!record) {
          throw new BadRequestException('Record not found');
        }
        
        // Get the medicine item to retrieve category_id and current count
        const medicineItem = await prisma.medicine.findUnique({
          where: {
            medicine_id_medName: {
              medicine_id: record.med_id,
              medName: record.medName
            }
          }
        });

        if (!medicineItem) {
          throw new BadRequestException('Medicine item not found');
        }

        // Update medicine count
        await prisma.medicine.update({
          where: {
            medicine_id_medName: {
              medicine_id: record.med_id,
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
        const newTotal = medicineItem.count + record.count;
        
        // Log the return to inventory in EditsMedicine
        await prisma.editsMedicine.create({
          data: {
            med_id: record.med_id,
            medName: record.medName,
            date: new Date(),
            cause: `Returned medication from cancelled administration (ID: ${id}, Patient: ${record.patient_name})`,
            addSubCount: record.count, // Positive for return
            runningTotal: newTotal,
            category_id: medicineItem.medCategory_id,
            nurse_id: record.nurse_id
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