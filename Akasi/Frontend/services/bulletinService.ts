import { get, post, put, del } from './apiService.js';

const BASE_URL = '/posts';
const FILES_URL = '/files';

// Define interfaces to improve type safety
interface PostData {
  nurse_id?: string;  // Changed from admin_id to nurse_id
  username?: string;
  caption?: string;
  text?: string;
}

interface PostFile {
  file_id: number;
  file_name: string;
  file_path: string;
  mime_type: string;
  file_size: number;
}

interface PostResponse {
  post_id: number;
  nurse_id: string;  // Changed from admin_id to nurse_id
  username: string;
  caption?: string;
  text?: string;
  files?: PostFile[];
  created_at: string;
}

/**
 * Fetches all posts from the server
 * @returns {Promise<PostResponse[]>} Array of posts
 */
export const fetchPosts = async (): Promise<PostResponse[]> => {
  try {
    const posts = await get(BASE_URL);
    // Sort posts by created_at in descending order (newest first)
    return posts.sort((a: PostResponse, b: PostResponse) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } catch (error) {
    console.error('Error fetching posts:', error);
    throw error;
  }
};

/**
 * Fetches details of a specific post
 * @param {number} postId - ID of the post to fetch
 * @returns {Promise<PostResponse>} Post details
 */
export const fetchPostDetails = async (postId: number): Promise<PostResponse> => {
  try {
    return await get(`${BASE_URL}/${postId}`);
  } catch (error) {
    console.error(`Error fetching post ${postId}:`, error);
    throw error;
  }
};

/**
 * Creates a new post with optional files
 * @param {PostData} postData - Post data including caption
 * @param {File[]} files - Array of files to upload
 * @returns {Promise<PostResponse>} Created post data
 */
export const createPost = async (postData: PostData, files: File[]): Promise<PostResponse> => {
  // Use FormData for file uploads
  const formData = new FormData();
  
  // Add post data
  if (postData.nurse_id) formData.append('nurse_id', postData.nurse_id);  // Changed from admin_id to nurse_id
  if (postData.username) formData.append('username', postData.username);
  if (postData.caption) formData.append('caption', postData.caption);
  if (postData.text) formData.append('text', postData.text);
  
  // Add files if any
  if (files && files.length) {
    files.forEach((file: File) => {
      if (file) {
        // Check file size before upload
        const fileSizeMB = file.size / (1024 * 1024);
        if (fileSizeMB > 50) { // 50MB limit
          console.warn(`File ${file.name} is ${fileSizeMB.toFixed(2)}MB which is large and may cause timeouts`);
        }
        formData.append('files', file);
      }
    });
  }

  try {
    // Use fetch directly with longer timeout for large uploads
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000); // 5 minute timeout
    
    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}${BASE_URL}`, 
      {
        method: 'POST',
        body: formData,
        signal: controller.signal
      }
    );
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Upload failed with status: ${response.status}`);
    }

    return await response.json();
  } catch (error: unknown) {
    if ((error as Error).name === 'AbortError') {
      console.error('Upload timed out after 5 minutes');
      throw new Error('Upload timed out. Please try with smaller files or fewer files.');
    }
    console.error('Error creating post:', error);
    throw error;
  }
};

/**
 * Updates an existing post
 * @param {number} postId - ID of post to update
 * @param {PostData} postData - Updated post data
 * @param {File[]} files - Array of new files to upload
 * @param {number[]} existingFileIds - IDs of files to keep associated with the post
 * @returns {Promise<PostResponse>} Updated post data
 */
export const updatePost = async (
  postId: number,
  postData: PostData,
  files: File[],
  existingFileIds?: number[]
): Promise<PostResponse> => {
  const formData = new FormData();
    
  // Add post data
  if (postData.caption !== undefined) formData.append('caption', postData.caption);
  if (postData.text) formData.append('text', postData.text);
  if (postData.nurse_id) formData.append('nurse_id', postData.nurse_id);  // Changed from admin_id to nurse_id
  if (postData.username) formData.append('username', postData.username);
  
  // Add files if any
  if (files && files.length) {
    files.forEach((file: File) => {
      if (file) {
        formData.append('files', file);
      }
    });
  }
  
  // FIXED: Always include existingFileIds, even if it's an empty array
  if (existingFileIds !== undefined) {
    formData.append('existingFiles', JSON.stringify(existingFileIds));
    console.log(`Sending existingFileIds: ${JSON.stringify(existingFileIds)}`);
  }

  // Use controller and timeout like in createPost for long uploads
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000); // 5 minute timeout

  try {
    // Use POST to the alternative update endpoint since the PUT route gives 404.
    const apiUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}${BASE_URL}/${postId}/update`;
    console.log(`Sending update request to: ${apiUrl}`, {
      postId,
      caption: postData.caption,
      filesCount: files?.length || 0,
      existingFileIds
    });
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    console.log(`Update response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error details available');
      console.error(`Failed update response body:`, errorText);
      throw new Error(`Update failed with status: ${response.status}`);
    }

    return await response.json();
  } catch (error: unknown) {
    if ((error as Error).name === 'AbortError') {
      console.error('Update timed out after 5 minutes');
      throw new Error('Update timed out. Please try with smaller files or fewer files.');
    }
    console.error(`Error updating post ${postId}:`, error);
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

/**
 * Deletes a post
 * @param {number} postId - ID of post to delete
 * @returns {Promise<any>} Result of deletion
 */
export const deletePost = async (postId: number): Promise<any> => {
  try {
    return await del(`${BASE_URL}/${postId}`);
  } catch (error) {
    console.error(`Error deleting post ${postId}:`, error);
    throw error;
  }
};

/**
 * Gets the file URL for a given file ID
 * @param {number} fileId - ID of the file
 * @returns {string} URL to access the file
 */
export const getFileUrl = (fileId: number): string => {
  return `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}${FILES_URL}/${fileId}`;
};