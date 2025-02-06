import { PrismaClient } from '@prisma/client';
import { defineEventHandler, readBody } from 'h3';

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  if (event.node.req.method === 'POST') {
    const body = await readBody(event);

    // Define types for the incoming request body
    const {
      client_id,
      admin_id,
      date,
      patient_name,
      patient_occupation,
      doctor,
      complaint,
      remarks,
      confined,
      medAdministration,
    }: {
      client_id: number;
      admin_id: number;
      date: string; // Can be adjusted based on your date format
      patient_name: string;
      patient_occupation: string;
      doctor: string;
      complaint: string;
      remarks: string;
      confined: boolean;
      medAdministration: boolean;
    } = body;

    try {
      const consultationRecord = await prisma.consultation_records.create({
        data: {
          client_id,
          admin_id,
          date: new Date(date), // Ensure date is a Date object
          patient_name,
          patient_occupation,
          doctor,
          complaint,
          remarks,
          confined,
          medAdministration,
        },
      });

      return { status: 'success', data: consultationRecord };
    } catch (error) {
      const err = error as Error;
      return { status: 'error', message: err.message };
    }
  }
});
