import { get, post, put, del } from './apiService';

const BASE_URL = '/medicine';

export interface Medicine {
  medicine_id: number;
  medName: string;
  medCategory_id: number;
  expiration: Date;
  count: number;
  otc: boolean;
}

/**
 * Fetches all medicines from the inventory
 * @returns {Promise<Medicine[]>} List of medicines
 */
export const fetchInventory = async () => {
  return get(BASE_URL);
};

/**
 * Creates a new medicine entry
 * @param {Medicine} data - Medicine data
 * @returns {Promise<Medicine>} Created medicine
 */
export const createMedicine = async (data: Medicine) => {
  return post(BASE_URL, data);
};

/**
 * Updates a medicine entry
 * @param {number} medicine_id - ID of medicine to update
 * @param {Partial<Medicine>} data - Fields to update
 * @returns {Promise<Medicine>} Updated medicine
 */
export const updateMedicine = async (medicine_id: number, data: Partial<Medicine>) => {
  return put(`${BASE_URL}/${medicine_id}`, data);
};

/**
 * Deletes a medicine entry
 * @param {number} medicine_id - ID of medicine to delete
 * @returns {Promise<void>} No content
 */
export const deleteMedicine = async (medicine_id: number) => {
  return del(`${BASE_URL}/${medicine_id}`);
};