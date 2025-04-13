import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class GetPatientConsultationsService {
    constructor(private prisma: PrismaService) {}

    async getConsultationsByPatientId(patientId: number) {
        return this.prisma.consultation_records.findMany({
            where: {
                patient_id: patientId
            },
            include: {
                diagnosis: {
                    include: {
                        diagnosis: true
                    }
                },
                prescriptions: true,
                medAdministrations: true
            },
            orderBy: {
                date: 'desc'
            }
        });
    }
}
