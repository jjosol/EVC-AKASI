import { get } from './apiService.js';
import {
  fetchConsultationRecordsCount as _fetchConsultationRecordsCount,
  fetchConfinedConsultationRecordsCount as _fetchConfinedConsultationRecordsCount,
  fetchYearlyConsultationCount as _fetchYearlyConsultationCount
} from './consultationRecordService.js';

export const fetchConfinedCount = async (year: number, month: number, forceRefresh = false): Promise<number> => {
  return _fetchConfinedConsultationRecordsCount(year, month, forceRefresh);
};

export const fetchMonthlyConsultationCount = async (year: number, month: number, forceRefresh = false): Promise<number> => {
  return _fetchConsultationRecordsCount(year, month, forceRefresh);
};

export const fetchYearlyConsultationCount = async (year: number, forceRefresh = false): Promise<number> => {
  return _fetchYearlyConsultationCount(year, forceRefresh);
};