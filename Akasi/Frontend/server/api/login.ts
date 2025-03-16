import { $fetch } from 'ohmyfetch';
import { defineEventHandler, readBody } from 'h3';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { username, password } = body;

    const backendUrl = 'http://localhost:3001/auth/login'; // Adjust if your backend is running elsewhere

    const response = await $fetch(backendUrl, {
      method: 'POST',
      body: { username, password },
    });

    return response; // Forward the response from the backend
  } catch (error: any) {
    console.error('Error during login:', error.message);
    throw createError({
      statusCode: 500,
      message: 'Login failed',
    });
  }
});