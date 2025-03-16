import { $fetch } from 'ohmyfetch';
import { defineEventHandler, readBody } from 'h3';

export default defineEventHandler(async (event) => {
  if (event.node.req.method === 'POST') {
    const body = await readBody(event);

    try {
      const backendUrl = 'http://localhost:3001/consultation-records'; // Adjust if your backend is running elsewhere

      const consultationRecord = await $fetch(backendUrl, {
        method: 'POST',
        body: body,
      });

      return consultationRecord; // Forward the response from the backend
    } catch (error: any) {
      console.error('Error creating consultation record:', error.message);
      throw createError({
        statusCode: 500,
        message: 'Failed to create consultation record',
      });
    }
  } else {
    throw createError({
      statusCode: 405,
      message: 'Method Not Allowed',
    });
  }
});