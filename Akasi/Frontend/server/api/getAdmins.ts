// server/api/getAdmins.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default defineEventHandler(async () => {
  // Fetch all admins from the Admin table
  const admins = await prisma.admin.findMany();
  return admins;
});
