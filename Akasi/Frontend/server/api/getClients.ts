// server/api/getClient.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  try {
    // Fetch data from the "client" table
    const clients = await prisma.client.findMany();

    // Return the list of clients
    return clients;
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: 'Error fetching clients',
    };
  }
});

