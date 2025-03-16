import { $fetch } from 'ohmyfetch';
import { defineEventHandler } from 'h3';

export default defineEventHandler(async (event) => {
  try {
    const clients = await $fetch('http://localhost:3001/clients');
    return clients;
  } catch (error) {
    console.error('Failed to fetch clients:', error);
    throw createError({
      statusCode: 500,
      message: 'Error fetching clients'
    });
  }
});