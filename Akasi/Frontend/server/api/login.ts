// server/api/login.ts
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken'; // For JWT token creation
import bcrypt from 'bcrypt'; // For password hashing and comparison

const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key'; // Use env variable for the secret key

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { username, password } = body; // Extract username and password from request body

    // Find user (either admin or client)
    const admin = await prisma.admin.findFirst({
      where: { username }
    });
    const client = await prisma.client.findFirst({
      where: { username }
    });

    // Check if the user exists
    const user = admin || client;

    if (!user) {
      return { isAuthenticated: false, message: 'Invalid username or password' }; // User not found
    }

    // Compare the provided password with the hashed password stored in the database
    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      return { isAuthenticated: false, message: 'Invalid username or password' }; // Password does not match
    }

    // Generate JWT token for the authenticated user
    const token = jwt.sign(
      { id: admin ? admin.admin_id : client?.client_id, role: admin ? 'admin' : 'client' }, // Use optional chaining
      SECRET_KEY,
      { expiresIn: '1h' } // Token will expire in 1 hour
    );

    // Return authentication status and JWT token
    return { isAuthenticated: true, token };
  } catch (error: unknown) { // Specify the type of error
    console.error('Error in authentication:', (error as Error).message); // Type assertion to access message
    return { isAuthenticated: false, message: 'Internal Server Error' };
  }
});
