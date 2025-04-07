import { get } from './apiService';

export const fetchConfinedCount = async (year: number, month: number) => {
  return await get(`/consultation-records/count?year=${year}&month=${month}&confined=true`);
};

export const fetchMonthlyConsultationCount = async (year: number, month: number) => {
  return await get(`/consultation-records/count?year=${year}&month=${month}`);
};

export const fetchYearlyConsultationCount = async (year: number) => {
  return await get(`/consultation-records/year-count?year=${year}`);
};