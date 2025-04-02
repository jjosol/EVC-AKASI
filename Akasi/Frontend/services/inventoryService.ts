import { get, post, put, del } from './apiService.js';

const BASE_URL = '/inventory';
const CATEGORY_URL = `${BASE_URL}/category`;

// Category operations
export const fetchCategories = async () => {
  return await get(`${BASE_URL}/categories`);
};

export const addCategory = async (data: { name: string }) => {
  return await post(CATEGORY_URL, data);
};

export const updateCategory = async (id: number, data: { name: string }) => {
  return await put(`${CATEGORY_URL}/${id}`, data);
};

export const deleteCategory = async (id: number) => {
  return await del(`${CATEGORY_URL}/${id}`);
};


// Inventory item operations
export const fetchInventoryItems = async () => {
  return await get(BASE_URL);
};

export const addInventoryItem = async (data: {
  name: string;
  expirationDate: string;
  count: number;
  category_id: number;
}) => {
  return await post(BASE_URL, data);
};

export const updateInventoryItem = async (
  id: number, 
  name: string, 
  data: {
    name: string;
    expirationDate: string;
    count: number;
    category_id: number;
  }
) => {
  return await put(`${BASE_URL}/${id}/${name}`, data);
};

export const deleteInventoryItem = async (id: number, name: string) => {
  return await del(`${BASE_URL}/${id}/${name}`);
};

export const deleteMedicineGroup = async (name: string) => {
  return await del(`${BASE_URL}/group/${name}`);
};

export const increaseInventory = async (
  id: number, 
  data: { 
    medName: string;
    quantity: number;
    cause?: string;
  }
) => {
  return await post(`${BASE_URL}/increase/${id}`, data);
};

export const reduceInventory = async (
  id: number, 
  name: string, 
  data: { 
    quantity: number;
    cause?: string;
  }
) => {
  return await put(`${BASE_URL}/reduce/${id}/${name}`, data);
};

export const updateMedicineName = async (
  oldName: string, 
  newName: string, 
  categoryId: number
) => {
  return await put(`${BASE_URL}/medicine/update-name`, {
    oldName,
    newName,
    categoryId
  });
};

export const fetchInventoryEdits = async () => {
  return await get(`${BASE_URL}/edits`);
};

// Helper function to format dates (can be used in components)
export const formatDate = (dateString: string | null | undefined): string => {
  return dateString ? new Date(dateString).toISOString().split('T')[0] : '';
};