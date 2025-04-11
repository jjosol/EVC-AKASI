import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class FetchAppointmentsPatientService {
    constructor(private prisma: PrismaService) { }

    /**
     * Get upcoming appointments for a specific patient or all appointments if admin
     * @param patientId The patient ID of the authenticated user
     * @param userRole The role of the authenticated user (patient, admin)
     * @returns List of upcoming appointments with patient information
     */
    async getUpcomingAppointments(patientId?: number, userRole?: string) {
        // Security check: If user is a patient, they can only view their own appointments
        if (userRole === 'patient' && !patientId) {
            throw new UnauthorizedException('Patient ID is required for patient users');
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to beginning of day

        // Build the where clause with date filter
        const where: any = {
            date: {
                gte: today,
            },
        };

        // Add patient_id filter if provided (applicable for both patients and admins)
        if (patientId !== undefined) {
            where.patient_id = patientId;
        }

        // First fetch appointments with filters
        const appointments = await this.prisma.appointment.findMany({
            where,
            orderBy: [
                { date: 'asc' },
                { hour: 'asc' },
                { minute: 'asc' },
            ],
            select: {
                appointment_id: true,
                patient_id: true,
                date: true,
                hour: true,
                minute: true,
                complaint: true,
                status: true,
                notes: true,
            }
        });

        // Then manually fetch patient data for each appointment
        const appointmentsWithPatients = await Promise.all(
            appointments.map(async (appointment) => {
                const patient = await this.prisma.patient.findUnique({
                    where: { patient_id: appointment.patient_id },
                    select: {
                        name: true,
                        category: true,
                        grade: true,
                        section: true,
                    },
                });

                if (!patient) {
                    return {
                        ...appointment,
                        patient: {
                            name: 'Unknown Patient',
                            category: 'Unknown',
                            grade: null,
                            section: ''
                        }
                    };
                }

                return {
                    ...appointment,
                    patient,
                };
            })
        );

        return appointmentsWithPatients;
    }
}