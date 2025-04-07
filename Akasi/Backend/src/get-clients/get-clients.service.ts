import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class GetClientsService {
    constructor(private prisma: PrismaService) { }

    async findAllStudents() {
        return this.prisma.client.findMany({
            where: {
                category: 'student',
            },
            select: {
                client_id: true,
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
        return this.prisma.client.findMany({
            where: {
                category: 'faculty',
            },
            select: {
                client_id: true,
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
        return this.prisma.client.findMany({
            where: {
                category: 'staff',
            },
            select: {
                client_id: true,
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
