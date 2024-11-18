// server/api/getClient.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  try {
    // Fetch only specific columns from the consultation_records table
    const patients = await prisma.consultation_records.findMany({
      select: {
        consultation_id: true,         // Include these fields you want
        patient_name: true, 
        patient_occupation: true,
        date: true,        // Replace with your actual  // column names
      }
    });
    
    return patients;
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: 'Error fetching clients',
    };
  }
});

