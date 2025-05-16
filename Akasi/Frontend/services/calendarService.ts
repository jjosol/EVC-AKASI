import { get } from './apiService';

export const fetchConfinedCount = async (year: number, month: number): Promise<number> => {
  try {
    const response = await get(`/consultation-records/count?year=${year}&month=${month}&confined=true`);
    console.log('Confined count response:', response);
    // Ensure we return a number, not an object
    return typeof response === 'number' ? response : 0;
  } catch (error) {
    console.error('Error fetching confined count:', error);
    return 0;
  }
};

export const fetchMonthlyConsultationCount = async (year: number, month: number): Promise<number> => {
  try {
    const response = await get(`/consultation-records/count?year=${year}&month=${month}`);
    console.log('Monthly consultation count response:', response);
    // Ensure we return a number, not an object
    return typeof response === 'number' ? response : 0;
  } catch (error) {
    console.error('Error fetching monthly consultation count:', error);
    return 0;
  }
};

export const fetchYearlyConsultationCount = async (year: number): Promise<number> => {
  try {
    const response = await get(`/consultation-records/year-count?year=${year}`);
    console.log('Yearly consultation count response:', response);
    // Ensure we return a number, not an object
    return typeof response === 'number' ? response : 0;
  } catch (error) {
    console.error('Error fetching yearly consultation count:', error);
    return 0;
  }
};