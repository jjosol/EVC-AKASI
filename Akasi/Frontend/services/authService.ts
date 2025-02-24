// filepath: /C:/Users/Acer/Documents/Github/EVC-CMS/Akasi/Frontend/services/authService.ts
import { post } from './apiService';

export async function login(username: string, password: string) {
  return await post('/auth/login', { username, password });
}