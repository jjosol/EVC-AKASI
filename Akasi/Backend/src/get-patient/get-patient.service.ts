import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class GetPatientService {
    constructor(private prisma: PrismaService) { }

    async findAllStudents() {
        return this.prisma.patient.findMany({
            where: {
                type: 'student',
            },
            select: {
                patient_id: true,
                gmail: true,
                name: true,
                grade: true,
                section: true,
            },
            orderBy: [
                { grade: 'asc' },
                { name: 'asc' },
            ],
        });
    }

    async findAllFaculty() {
        return this.prisma.patient.findMany({
            where: {
                type: 'faculty',
            },
            select: {
                patient_id: true,
                name: true,
                section: true,
            },
            orderBy: [
                { section: 'asc' },
                { name: 'asc' },
            ],
        });
    }

    async findAllStaff() {
        return this.prisma.patient.findMany({
            where: {
                type: 'staff',
            },
            select: {
                patient_id: true,
                name: true,
                section: true,
            },
            orderBy: [
                { section: 'asc' },
                { name: 'asc' },
            ],
        });
    }
}
