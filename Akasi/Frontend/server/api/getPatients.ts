import { $fetch } from 'ohmyfetch';
import { defineEventHandler } from 'h3';

export default defineEventHandler(async (event) => {
  try {
    const patients = await $fetch('http://localhost:3001/patients');
    return patients;
  } catch (error) {
    console.error('Failed to fetch patients:', error);
    throw createError({
      statusCode: 500,
      message: 'Error fetching patients'
    });
  }
});