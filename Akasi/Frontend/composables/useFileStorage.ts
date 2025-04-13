import { ref } from 'vue';

interface FileStatus {
  file_id: number;
  file_type: string;
  patient_id: number;
  status: string;
  notes: string | null;
}

export function useFileStorage() {
  const loading = ref(false);
  const error = ref<string | null>(null);

  const apiBaseUrl = process.env.NODE_ENV === 'production'
    ? '/api'
    : 'http://localhost:3001';

  // Fetch file by ID and type
  const fetchFile = async (fileType: string, fileId: number) => {
    loading.value = true;
    error.value = null;

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`${apiBaseUrl}/fetch-patient-files/file/${fileType}/${fileId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      
      // Get file content info from response headers if available
      const fileName = response.headers.get('X-Filename') || `${fileType}_${fileId}`;
      const mimeType = blob.type || 'application/octet-stream';
      
      // Create URL for the blob
      const url = URL.createObjectURL(blob);
      
      return {
        url,
        blob,
        fileName,
        mimeType,
        size: blob.size
      };
    } catch (err) {
      console.error('Error fetching file:', err);
      error.value = err instanceof Error ? err.message : 'An unknown error occurred';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Upload a new file
  const uploadFile = async (
    patientId: number, 
    fileType: string, 
    file: File, 
    grade?: number | null
  ) => {
    loading.value = true;
    error.value = null;

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', fileType);
      
      if (grade !== undefined && grade !== null) {
        formData.append('grade', grade.toString());
      }

      const response = await fetch(`${apiBaseUrl}/patient-files/${patientId}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Failed to upload file: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to upload file');
      }
      
      return result.data;
    } catch (err) {
      console.error('Error uploading file:', err);
      error.value = err instanceof Error ? err.message : 'An unknown error occurred';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Update file status
  const updateFileStatus = async (
    fileId: number,
    fileType: string,
    patientId: number,
    status: string,
    notes?: string | null
  ) => {
    loading.value = true;
    error.value = null;

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const fileData = {
        fileId,
        fileType,
        patientId,
        status,
        notes: notes || null
      };

      const response = await fetch(`${apiBaseUrl}/update-file-status`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(fileData)
      });

      if (!response.ok) {
        throw new Error(`Failed to update status: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to update file status');
      }
      
      return result.data;
    } catch (err) {
      console.error('Error updating file status:', err);
      error.value = err instanceof Error ? err.message : 'An unknown error occurred';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Delete a file
  const deleteFile = async (fileType: string, fileId: number) => {
    loading.value = true;
    error.value = null;

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`${apiBaseUrl}/patient-files/${fileType}/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to delete file: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to delete file');
      }
      
      return result.data;
    } catch (err) {
      console.error('Error deleting file:', err);
      error.value = err instanceof Error ? err.message : 'An unknown error occurred';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Release URL when done
  const releaseFileUrl = (url: string) => {
    if (url) {
      URL.revokeObjectURL(url);
    }
  };

  return {
    loading,
    error,
    fetchFile,
    uploadFile,
    updateFileStatus,
    deleteFile,
    releaseFileUrl
  };
}