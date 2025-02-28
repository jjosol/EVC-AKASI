import { get, post, put, del } from './apiService';

const BASE_URL = '/posts';
const FILES_URL = '/files';

// Define interfaces to improve type safety
interface PostData {
  admin_id?: string;
  username?: string;
  caption?: string;
  text?: string;
}

interface PostFile {
  file_id: number;
  file_name: string;
  file_type: string;
  mime_type: string;
}

interface PostResponse {
  post_id: number;
  admin_id: string;
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
  if (postData.admin_id) formData.append('admin_id', postData.admin_id);
  if (postData.username) formData.append('username', postData.username);
  if (postData.caption) formData.append('caption', postData.caption);
  if (postData.text) formData.append('text', postData.text);
  
  // Add files if any
  if (files && files.length) {
    files.forEach((file: File) => {
      if (file) {
        formData.append('files', file);
      }
    });
  }

  try {
    // Use fetch directly since we need FormData for file uploads
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}${BASE_URL}`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Upload failed with status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating post:', error);
    throw error;
  }
};

/**
 * Updates an existing post
 * @param {number} postId - ID of post to update
 * @param {PostData} postData - Updated post data
 * @param {File[]} files - Array of new files to upload
 * @returns {Promise<PostResponse>} Updated post data
 */
export const updatePost = async (postId: number, postData: PostData, files: File[]): Promise<PostResponse> => {
  const formData = new FormData();
    
  // Add post data
  if (postData.caption) formData.append('caption', postData.caption);
  if (postData.text) formData.append('text', postData.text);
  if (postData.admin_id) formData.append('admin_id', postData.admin_id);
  if (postData.username) formData.append('username', postData.username);
  
  // Add files if any
  if (files && files.length) {
    files.forEach((file: File) => {
      if (file) {
        formData.append('files', file);
      }
    });
  }

  try {
    // Use fetch directly since we need FormData for file uploads
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}${BASE_URL}/${postId}`, {
      method: 'PATCH',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Update failed with status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error updating post ${postId}:`, error);
    throw error;
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