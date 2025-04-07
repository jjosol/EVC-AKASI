import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class DiagnosisService {
    private readonly logger = new Logger(DiagnosisService.name);

    constructor(private prisma: PrismaService) { }

    async getAllDiagnoses() {
        try {
            return await this.prisma.diagnosis.findMany({
                include: {
                    category: true,
                    admin: {
                        select: {
                            name: true
                        }
                    }
                }
            });
        } catch (error) {
            this.logger.error('Failed to fetch diagnoses', error.stack);
            throw new BadRequestException('Failed to fetch diagnoses');
        }
    }

    async getDiagnosisById(diagnosis_id: number) {
        try {
            const diagnosis = await this.prisma.diagnosis.findUnique({
                where: { diagnosis_id },
                include: {
                    category: true,
                    admin: {
                        select: {
                            name: true
                        }
                    }
                }
            });

            if (!diagnosis) {
                throw new NotFoundException(`Diagnosis with ID ${diagnosis_id} not found`);
            }

            return diagnosis;
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            this.logger.error(`Failed to fetch diagnosis: ${diagnosis_id}`, error.stack);
            throw new BadRequestException(`Failed to fetch diagnosis: ${error.message}`);
        }
    }

    async createDiagnosis(data: {
        name: string;
        category_id: number;
        created_by: number
    }) {
        try {
            // Check if category exists
            const category = await this.prisma.diagnosis_category.findUnique({
                where: { category_id: data.category_id }
            });

            if (!category) {
                throw new NotFoundException(`Category with ID ${data.category_id} not found`);
            }

            // Check if diagnosis with same name already exists
            const existingDiagnosis = await this.prisma.diagnosis.findFirst({
                where: { name: data.name }
            });

            if (existingDiagnosis) {
                throw new BadRequestException(`Diagnosis with name '${data.name}' already exists`);
            }

            const diagnosis = await this.prisma.diagnosis.create({
                data: {
                    name: data.name,
                    category_id: data.category_id,
                    created_by: data.created_by
                },
                include: {
                    category: true
                }
            });

            return diagnosis;
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            this.logger.error('Failed to create diagnosis', error.stack);
            throw new BadRequestException(`Failed to create diagnosis: ${error.message}`);
        }
    }

    async updateDiagnosis(diagnosis_id: number, data: {
        name?: string;
        category_id?: number;
    }) {
        try {
            // Check if diagnosis exists
            const existingDiagnosis = await this.prisma.diagnosis.findUnique({
                where: { diagnosis_id }
            });

            if (!existingDiagnosis) {
                throw new NotFoundException(`Diagnosis with ID ${diagnosis_id} not found`);
            }

            // If category_id is provided, check if it exists
            if (data.category_id) {
                const category = await this.prisma.diagnosis_category.findUnique({
                    where: { category_id: data.category_id }
                });
                if (!category) {
                    throw new NotFoundException(`Category with ID ${data.category_id} not found`);
                }
            }

            // If name is provided, check if it's unique (excluding current diagnosis)
            if (data.name && data.name !== existingDiagnosis.name) {
                const duplicateName = await this.prisma.diagnosis.findFirst({
                    where: {
                        name: data.name,
                        NOT: {
                            diagnosis_id: diagnosis_id
                        }
                    }
                });
                if (duplicateName) {
                    throw new BadRequestException(`Another diagnosis with name '${data.name}' already exists`);
                }
            }

            const diagnosis = await this.prisma.diagnosis.update({
                where: { diagnosis_id },
                data,
                include: {
                    category: true
                }
            });

            return diagnosis;
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            this.logger.error(`Failed to update diagnosis: ${diagnosis_id}`, error.stack);
            throw new BadRequestException(`Failed to update diagnosis: ${error.message}`);
        }
    }

    async deleteDiagnosis(diagnosis_id: number) {
        try {
            // First check if diagnosis exists
            const diagnosis = await this.prisma.diagnosis.findUnique({
                where: { diagnosis_id }
            });

            if (!diagnosis) {
                throw new NotFoundException(`Diagnosis with ID ${diagnosis_id} not found`);
            }

            // Check if this diagnosis is linked to any consultations
            const usageCount = await this.prisma.consultation_diagnosis.count({
                where: { diagnosis_id }
            });

            if (usageCount > 0) {
                // Instead of blocking the deletion, we'll inform about usage
                this.logger.warn(`Deleting diagnosis ID ${diagnosis_id} which is used in ${usageCount} consultations`);
            }

            await this.prisma.diagnosis.delete({
                where: { diagnosis_id }
            });

            return { message: `Diagnosis with ID ${diagnosis_id} deleted successfully` };
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            this.logger.error(`Failed to delete diagnosis: ${diagnosis_id}`, error.stack);
            throw new BadRequestException(`Failed to delete diagnosis: ${error.message}`);
        }
    }

    async getAllCategories() {
        try {
            const categories = await this.prisma.diagnosis_category.findMany({
                include: {
                    _count: {
                        select: {
                            diagnoses: true
                        }
                    }
                }
            });

            return categories.map(category => ({
                ...category,
                diagnoses_count: category._count.diagnoses
            }));
        } catch (error) {
            this.logger.error('Failed to fetch categories', error.stack);
            throw new BadRequestException('Failed to fetch diagnosis categories');
        }
    }

    async createCategory(data: { name: string }) {
        try {
            // Check if category with same name already exists
            const existingCategory = await this.prisma.diagnosis_category.findFirst({
                where: { name: data.name }
            });

            if (existingCategory) {
                throw new BadRequestException(`Category with name '${data.name}' already exists`);
            }

            return this.prisma.diagnosis_category.create({
                data
            });
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            this.logger.error('Failed to create category', error.stack);
            throw new BadRequestException(`Failed to create category: ${error.message}`);
        }
    }

    async updateCategory(category_id: number, data: { name: string }) {
        try {
            // Check if category exists
            const existingCategory = await this.prisma.diagnosis_category.findUnique({
                where: { category_id }
            });

            if (!existingCategory) {
                throw new NotFoundException(`Category with ID ${category_id} not found`);
            }

            // Check if name is unique
            if (data.name !== existingCategory.name) {
                const duplicateName = await this.prisma.diagnosis_category.findFirst({
                    where: {
                        name: data.name,
                        NOT: {
                            category_id
                        }
                    }
                });

                if (duplicateName) {
                    throw new BadRequestException(`Another category with name '${data.name}' already exists`);
                }
            }

            return this.prisma.diagnosis_category.update({
                where: { category_id },
                data
            });
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            this.logger.error(`Failed to update category: ${category_id}`, error.stack);
            throw new BadRequestException(`Failed to update category: ${error.message}`);
        }
    }

    async deleteCategory(category_id: number) {
        try {
            // First check if category exists
            const category = await this.prisma.diagnosis_category.findUnique({
                where: { category_id }
            });

            if (!category) {
                throw new NotFoundException(`Category with ID ${category_id} not found`);
            }

            // Check if this category has any diagnoses
            const diagnoses = await this.prisma.diagnosis.findMany({
                where: { category_id }
            });

            if (diagnoses.length > 0) {
                throw new BadRequestException(`Cannot delete category with ID ${category_id} because it contains ${diagnoses.length} diagnoses. Please delete or move these diagnoses first.`);
            }

            await this.prisma.diagnosis_category.delete({
                where: { category_id }
            });

            return { message: `Category with ID ${category_id} deleted successfully` };
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            this.logger.error(`Failed to delete category: ${category_id}`, error.stack);
            throw new BadRequestException(`Failed to delete category: ${error.message}`);
        }
    }

    // New method to clean up invalid consultation_diagnosis relationships
    async cleanupInvalidDiagnosisReferences() {
        try {
            // Find all consultation_diagnosis entries that reference non-existent diagnoses
            const invalidReferences = await this.prisma.$queryRaw`
        SELECT cd.consultation_id, cd.diagnosis_id
        FROM consultation_diagnosis cd
        LEFT JOIN diagnosis d ON cd.diagnosis_id = d.diagnosis_id
        WHERE d.diagnosis_id IS NULL
      `;

            if (Array.isArray(invalidReferences) && invalidReferences.length > 0) {
                this.logger.warn(`Found ${invalidReferences.length} invalid diagnosis references`);

                // Delete all invalid references
                for (const ref of invalidReferences) {
                    await this.prisma.consultation_diagnosis.delete({
                        where: {
                            consultation_id_diagnosis_id: {
                                consultation_id: ref.consultation_id,
                                diagnosis_id: ref.diagnosis_id
                            }
                        }
                    });
                }

                return {
                    message: `Successfully cleaned up ${invalidReferences.length} invalid diagnosis references`,
                    cleaned: invalidReferences
                };
            }

            return { message: 'No invalid diagnosis references found' };
        } catch (error) {
            this.logger.error('Failed to clean up invalid diagnosis references', error.stack);
            throw new BadRequestException(`Failed to clean up invalid diagnosis references: ${error.message}`);
        }
    }
}
