const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export async function get(endpoint: string) {
  const response = await fetch(`${baseUrl}${endpoint}`);
  if (!response.ok) {
    throw new Error(`GET ${endpoint} failed: ${response.statusText}`);
  }
  return response.json();
}

export async function post(endpoint: string, data: any) {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${baseUrl}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `POST ${endpoint} failed`);
  }
  return response.json();
}

export async function put(endpoint: string, data: any) {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${baseUrl}${endpoint}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `PUT ${endpoint} failed`);
  }
  return response.json();
}

export async function del(endpoint: string) {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${baseUrl}${endpoint}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) {
    throw new Error(`DELETE ${endpoint} failed: ${response.statusText}`);
  }
  return response.json();
}