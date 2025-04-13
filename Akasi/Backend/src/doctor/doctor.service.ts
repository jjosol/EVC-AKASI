import { Injectable, HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class DoctorService {
    constructor(private readonly prisma: PrismaService) {}

    // Get all doctors with selected fields
    async getAllDoctors() {
        try {
            return await this.prisma.doctor.findMany({
                select: {
                    doctor_id: true,
                    username: true,
                    gmail: true,
                    name: true,
                }
            });
        } catch (error) {
            throw new HttpException(
                'Failed to fetch doctors: ' + error.message,
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    // Get doctor by ID
    async getDoctorById(doctorId: number) {
        try {
            const doctor = await this.prisma.doctor.findUnique({
                where: { doctor_id: doctorId },
                select: {
                    doctor_id: true,
                    username: true,
                    gmail: true,
                    name: true,
                }
            });

            if (!doctor) {
                throw new NotFoundException(`Doctor with ID ${doctorId} not found`);
            }

            return doctor;
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new HttpException(
                'Failed to fetch doctor: ' + error.message,
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    // Create new doctor
    async createDoctor(data: { username: string; password: string; gmail: string; name: string }) {
        try {
            // Check if username already exists
            const existingDoctor = await this.prisma.doctor.findFirst({
                where: { username: data.username }
            });

            if (existingDoctor) {
                throw new HttpException('Username already exists', HttpStatus.CONFLICT);
            }

            // Hash the password
            const hashedPassword = await bcrypt.hash(data.password, 10);

            // Create the doctor
            return await this.prisma.doctor.create({
                data: {
                    username: data.username,
                    password: hashedPassword,
                    gmail: data.gmail,
                    name: data.name
                },
                select: {
                    doctor_id: true,
                    username: true,
                    gmail: true,
                    name: true,
                }
            });
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                'Failed to create doctor: ' + error.message,
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}
