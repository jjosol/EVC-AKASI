export async function fetchUserProfile(token: string) {
    try {
      const response = await fetch('http://localhost:3001/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
  
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed');
        }
        throw new Error('Failed to fetch profile');
      }
  
      return await response.json();
    } catch (error) {
      console.error('Profile fetch error:', error);
      throw error; // Re-throw the error so the composable can handle it
    }
  }