<script setup>
    import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
    import { useProfile } from '~/composables/useProfile';
    import { useClientConsultations } from '~/composables/useClientConsultations';

    const { profile, loading: profileLoading, error: profileError, fetchProfile } = useProfile();

    // State variables
    const fileStatuses = ref([]);
    const loadingStatuses = ref(false);
    const clientFiles = ref([]);
    const loadingFiles = ref(false);
    const activeTab = ref('tab1');
    const showModal = ref(false);
    const isUploading = ref(false);
    const uploadProgress = ref(0);
    const uploadError = ref('');
    const showViewerModal = ref(false);
    const selectedFile = ref(null);
    const fileError = ref('');
    const fileLoading = ref(false);
    const showAccessDeniedModal = ref(false);

    // Add the consultations composable
    const { 
    consultations, 
    loading: consultationsLoading, 
    error: consultationsError,  
    } = useClientConsultations();

    const fetchConsultations = async (clientId) => {
        if (!clientId) {
            consultationsError.value = 'Client ID is required'
            return
        }

        try {
            consultationsLoading.value = true
            consultationsError.value = null

            const token = localStorage.getItem('token')
            if (!token) {
                throw new Error('Authentication token not found')
            }

            // Log the URL we're calling
            const url = `http://localhost:3001/consultation-records/client/${clientId}`
            console.log('Fetching consultations from:', url)

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            // Log the response status
            console.log('Response status:', response.status, response.statusText)

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`)
            }

            consultations.value = await response.json()
            console.log('Received consultations:', consultations.value.length)
        } catch (err) {
            console.error('Error fetching consultations:', err)
            consultationsError.value = err.message || 'Failed to load consultation records'
        } finally {
            consultationsLoading.value = false
        }
    }

    // Status definitions with colors
    const statusColors = {
        'pending': { bg: 'bg-yellow-100', text: 'text-yellow-800' },
        'approved': { bg: 'bg-green-100', text: 'text-green-800' },
        'rejected': { bg: 'bg-red-100', text: 'text-red-800' },
        'under_review': { bg: 'bg-blue-100', text: 'text-blue-800' },
        'requires_update': { bg: 'bg-orange-100', text: 'text-orange-800' }
    };

    // Upload form data - removed grade
    const uploadForm = ref({
        certType: '',
        file: null
    });

    const certificateTypes = [
        { label: 'Dental Certificate', value: 'dental' },
        { label: 'Medical Certificate', value: 'medical' },
        { label: 'Ophthalmological Certificate', value: 'opthal' },
        { label: 'Physical Examination', value: 'physical' }
    ];

    
    // Add this function to debug your JWT token
    function debugToken() {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('❌ No token found in localStorage');
            return null;
        }
        
        try {
            // Split the token to get the payload part
            const parts = token.split('.');
            if (parts.length !== 3) {
            console.error('❌ Token is not in valid JWT format');
            return null;
            }
            
            // Decode the payload (middle part)
            const payload = JSON.parse(atob(parts[1]));
            console.log('✅ Token payload:', payload);
            
            // The most important fields to check
            console.log('Token data:');
            console.log('- sub:', payload.sub);
            console.log('- role:', payload.role);
            
            // Check expiration
            if (payload.exp) {
            const expDate = new Date(payload.exp * 1000);
            const now = new Date();
            const isExpired = expDate < now;
            console.log('Token expires:', expDate);
            console.log('Current time:', now);
            console.log('Is expired:', isExpired);
            
            if (isExpired) {
                console.error('❌ Token is expired!');
                return null;
            }
            }
            
            return payload;
        } catch (e) {
            console.error('❌ Error parsing token:', e);
            return null;
        }
    }

    function downloadFile(file) {
        if (!file || !file.url) {
            showToast({
            message: 'No file available to download',
            type: 'error'
            });
            return;
        }

        // Create an anchor element and set the download attribute
        const a = document.createElement('a');
        a.href = file.url;
        a.download = file.fileName || `${file.type}_${file.id}.${getFileExtension(file)}`;
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        document.body.removeChild(a);
    }

    // Function to format status text for display
    function formatStatus(status) {
        if (!status) return 'Unknown';
        
        // Convert snake_case to Title Case
        return status
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    // Function to get status color classes
    function getStatusClasses(status) {
        const defaultClasses = { bg: 'bg-gray-100', text: 'text-gray-800' };
        return statusColors[status?.toLowerCase()] || defaultClasses;
    }

    // Fetch file statuses for current client
    async function fetchFileStatuses() {
        try {
            if (!currentClientId.value) {
                console.error('Cannot fetch file statuses: No client ID available');
                return;
            }

            loadingStatuses.value = true;
            const token = localStorage.getItem('token');
            
            if (!token) {
                throw new Error('Authentication token not found');
            }

            const response = await fetch(`http://localhost:3001/fetch-file-statuses?client_id=${currentClientId.value}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch file statuses: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            
            if (result.success && Array.isArray(result.data)) {
                fileStatuses.value = result.data;
                console.log('File statuses loaded:', fileStatuses.value);
                
                // Merge file statuses with client files
                mergeFileStatusesWithFiles();
            } else {
                console.error('Invalid response format for file statuses:', result);
            }
        } catch (error) {
            console.error('Error fetching file statuses:', error);
        } finally {
            loadingStatuses.value = false;
        }
    }

    // Merge file statuses with client files
    function mergeFileStatusesWithFiles() {
        if (!clientFiles.value.length || !fileStatuses.value.length) return;
        
        clientFiles.value = clientFiles.value.map(file => {
            // Find matching status record
            const statusRecord = fileStatuses.value.find(status => 
                status.file_type === file.type && status.file_id === file.id
            );
            
            if (statusRecord) {
                return {
                    ...file,
                    status: statusRecord.status || 'pending',
                    notes: statusRecord.notes || ''
                };
            }
            
            return file;
        });
    }

    const currentClientId = computed(() => {
        // Check if profile is loaded
        if (profileLoading.value) {
            console.log('Profile is still loading...');
            return null;
        }
        
        // Check if profile exists
        if (!profile.value) {
            console.error('Profile is null or undefined');
            return null;
        }
        
        // For debugging, log the profile
        console.log('Profile data:', profile.value);
        
        // Try to extract client ID from profile
        let clientId = null;
        
        // Option 1: Try to get from profile.client_id
        if (profile.value.client_id !== undefined) {
            clientId = Number(profile.value.client_id);
            console.log(`Using profile.client_id: ${clientId}`);
            return clientId;
        }
        
        // Option 2: Try to get from profile.id
        if (profile.value.id !== undefined) {
            clientId = Number(profile.value.id);
            console.log(`Using profile.id: ${clientId}`);
            return clientId;
        }
        
        // Option 3: Try to get from profile.data.client_id
        if (profile.value.data && profile.value.data.client_id !== undefined) {
            clientId = Number(profile.value.data.client_id);
            console.log(`Using profile.data.client_id: ${clientId}`);
            return clientId;
        }
        
        // Option 4: Check JWT token
        console.log('Trying to extract client ID from JWT token...');
        const tokenPayload = debugToken();
        if (tokenPayload) {
            // In your JWT strategy, 'sub' is used for the ID
            if (tokenPayload.sub !== undefined) {
                clientId = Number(tokenPayload.sub);
                console.log(`Using JWT token sub field: ${clientId}`);
                return clientId;
            }
        }
        
        console.error('⚠️ No valid client ID found in profile or token');
        fileError.value = 'User information not available. Please log in again.';
        return null;
    });

    // Computed property to check if form is valid
    const isFormValid = computed(() => {
        return uploadForm.value.certType && uploadForm.value.file;
    });

    // Updated viewFile function to use the correct endpoint
    async function viewFile(file) {
        try {
            fileLoading.value = true;
            selectedFile.value = { ...file }; // Set initial file info
            showViewerModal.value = true;
            document.body.classList.add('overflow-hidden');
            
            const token = localStorage.getItem('token');
            
            if (!token) {
                throw new Error('Authentication token not found');
            }

            console.log(`Requesting file: ${file.type}/${file.id}`);
            
            // The backend will verify that this file belongs to the current user
            // Use the CORRECT endpoint for file viewing - note that we're using fetch-client-files now
            const response = await fetch(`http://localhost:3001/fetch-client-files/file/${file.type}/${file.id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                // If file is not found or not authorized, backend returns 404
                throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
            }
            
            // Get file content as blob
            const blob = await response.blob();
            console.log('Received blob size:', blob.size, 'type:', blob.type);

            // Create URL for the blob
            const url = URL.createObjectURL(blob);

            // Always detect the mime type to ensure accuracy
            let mimeType = await detectMimeType(blob);
            
            console.log('Detected MIME type:', mimeType);
            
            // Update the component state with the URL and detected mime type
            selectedFile.value = {
                ...file,
                url: url,
                mimeType: mimeType,
                fileName: getFileNameFromType(file.type, file.id, mimeType),
                isImage: mimeType.startsWith('image/')
            };

        } catch (error) {
            console.error('Error viewing file:', error);
            showToast({
                message: 'Failed to load file: ' + error.message,
                type: 'error'
            });
            closeViewerModal();
        } finally {
            fileLoading.value = false;
        }
    }
    
    // Add this function to detect MIME type from file signature
    async function detectMimeType(blob) {
        // Only read the first few bytes to check the file signature
        const firstBytes = await blob.slice(0, 4).arrayBuffer();
        const signature = new Uint8Array(firstBytes);
        
        // Check for PDF signature: %PDF (25 50 44 46)
        if (signature[0] === 0x25 && signature[1] === 0x50 && 
            signature[2] === 0x44 && signature[3] === 0x46) {
            return 'application/pdf';
        }
        
        // Check for PNG signature: PNG (89 50 4E 47)
        if (signature[0] === 0x89 && signature[1] === 0x50 && 
            signature[2] === 0x4E && signature[3] === 0x47) {
            return 'image/png';
        }
        
        // Check for JPEG signature: FFD8 (first 2 bytes)
        if (signature[0] === 0xFF && signature[1] === 0xD8) {
            return 'image/jpeg';
        }
        
        // Default to PDF if we can't determine the type
        return 'application/pdf';
    }


    // Function to close the access denied modal
    function closeAccessDeniedModal() {
        showAccessDeniedModal.value = false;
    }

    // Function to show the access denied modal
    function showAccessDenied() {
        showAccessDeniedModal.value = true;
    }
    
    // Close viewer modal and clean up
    function closeViewerModal() {
        if (selectedFile.value && selectedFile.value.url) {
            // Revoke the object URL to free up memory
            URL.revokeObjectURL(selectedFile.value.url);
        }
        
        showViewerModal.value = false;
        document.body.classList.remove('overflow-hidden');
        selectedFile.value = null;
    }

    function formatDate(dateString) {
        if (!dateString) return '';
        
        try {
            const date = new Date(dateString);
            const options = { month: 'short', day: 'numeric', year: 'numeric' };
            return date.toLocaleDateString('en-US', options);
        } catch (e) {
            return dateString;
        }
    }

    // Modal functions
    function openModal() {
        showModal.value = true;
        document.body.classList.add('overflow-hidden');
        // Reset form when opening modal
        resetUploadForm();
    }

    function closeModal() {
        showModal.value = false;
        document.body.classList.remove('overflow-hidden');
        resetUploadForm();
    }

    function resetUploadForm() {
        uploadForm.value = {
            certType: '',
            file: null
        };
        uploadError.value = '';
        uploadProgress.value = 0;
        isUploading.value = false;
    }

    // Generate a filename based on file type and detected mime type
    function getFileNameFromType(fileType, fileId, mimeType) {
        let extension = 'pdf'; // Default extension
        
        // Determine extension from mime type
        if (mimeType) {
            if (mimeType === 'application/pdf') {
                extension = 'pdf';
            } else if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
                extension = 'jpg';
            } else if (mimeType === 'image/png') {
                extension = 'png';
            } else if (mimeType === 'image/gif') {
                extension = 'gif';
            } else {
                // Extract extension from mime type if possible
                const parts = mimeType.split('/');
                if (parts.length === 2 && parts[1] !== 'octet-stream') {
                    extension = parts[1];
                }
            }
        }
        
        return `${fileType}_${fileId}.${extension}`;
    }

    // Get file extension from file object
    function getFileExtension(file) {
        if (!file) return 'pdf';
        
        if (file.mimeType) {
            if (file.mimeType === 'application/pdf') return 'pdf';
            if (file.mimeType === 'image/jpeg' || file.mimeType === 'image/jpg') return 'jpg';
            if (file.mimeType === 'image/png') return 'png';
            if (file.mimeType === 'image/gif') return 'gif';
            
            // Extract extension from mime type
            const parts = file.mimeType.split('/');
            if (parts.length === 2 && parts[1] !== 'octet-stream') {
                return parts[1];
            }
        }
        
        return 'pdf'; // Default to PDF if no mime type information
    }

    // Check if file is of a specific type
    function isFileType(file, type) {
        if (!file || !file.mimeType) return false;
        
        switch (type) {
            case 'pdf':
                return file.mimeType === 'application/pdf';
            case 'image':
                return file.mimeType.startsWith('image/');
            case 'text':
                return file.mimeType.startsWith('text/');
            default:
                return false;
        }
    }

    // Format file type for display
    function formatFileType(fileType) {
        const types = {
            'dental': 'Dental Certificate',
            'medical': 'Medical Certificate',
            'opthal': 'Ophthalmological Certificate',
            'physical': 'Physical Examination'
        };
        
        return types[fileType] || fileType;
    }

    // Format file size for display
    function formatFileSize(bytes) {
        if (!bytes) return '';
        
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes === 0) return '0 Byte';
        const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
    }

    // Add a simple showToast function
    function showToast(options) {
        console.log(`Toast: ${options.message} (${options.type})`);
        // Implementation would depend on your UI framework
    }

    // Simulate upload progress for better UX
    function simulateProgress() {
        return setInterval(() => {
            if (uploadProgress.value < 90) {
                uploadProgress.value += Math.floor(Math.random() * 10) + 1;
            }
        }, 300);
    }

    // Fetch files for the current client
    async function fetchFiles() {
        try {
            await fetchFileStatuses();
            loadingFiles.value = true;
            fileError.value = '';
            clientFiles.value = [];
            
            const token = localStorage.getItem('token');
            if (!token) {
                console.warn('No authentication token found.');
                fileError.value = 'Authentication token not found. Please log in again.';
                loadingFiles.value = false;
                return;
            }
            
            const clientId = currentClientId.value;
            if (!clientId) {
                console.warn('No client ID available.');
                fileError.value = 'Client ID not available. Please log in again.';
                loadingFiles.value = false;
                return;
            }
            
            // Use the endpoint to get files by client ID
            console.log(`Fetching files for client ID: ${clientId}`);
            
            const response = await fetch(`http://localhost:3001/client-files-staff/by-client/${clientId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            console.log('Response status:', response.status);
            
            if (!response.ok) {
                // Handle different error types
                if (response.status === 401) {
                    fileError.value = 'Your session has expired. Please log in again.';
                    loadingFiles.value = false;
                    return;
                }
                
                throw new Error(`Failed to fetch files: ${response.status} ${response.statusText}`);
            }
            
            const files = await response.json();
            console.log(`Fetched ${files.length} total files for the current client`);
            clientFiles.value = files;
            
            // If we have files, clear any previous error
            if (clientFiles.value.length > 0) {
                fileError.value = '';
            } else {
                console.log(`No files found for client`);
            }

            await fetchFileStatuses();
            
        } catch (error) {
            console.error('Error fetching files:', error);
            fileError.value = 'Failed to load files. Please try again.';
            clientFiles.value = [];
        } finally {
            loadingFiles.value = false;
        }
    }

    // Upload file to server
    // Fixed uploadFile function to solve the clientId reference error
    async function uploadFile() {
        try {
            isUploading.value = true;
            uploadError.value = '';
            
            // Get client ID from the computed property FIRST
            const clientId = currentClientId.value;
            
            if (!clientId) {
                throw new Error('Client ID not available. Please log in again.');
            }
            
            console.log('Using client ID for upload:', clientId);
            
            // Start progress simulation
            const progressInterval = simulateProgress();
            
            // Debug the token
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Authentication token not found. Please log in again.');
            }
            
            if (token) {
                // Decode the token to verify payload
                const payload = JSON.parse(atob(token.split('.')[1]));
                console.log('Token payload:', payload);
            }

            // Create FormData and append fields
            const formData = new FormData();
            
            // Ensure these match the backend expectation
            formData.append('file', uploadForm.value.file); // Matches @UploadedFile() parameter
            formData.append('type', uploadForm.value.certType); // Matches @Body('type') parameter
            formData.append('client_id', clientId.toString()); // Convert to string
            
            console.log('Sending form data:', {
                file: uploadForm.value.file?.name,
                type: uploadForm.value.certType,
                client_id: clientId
            });

            // Send the request
            const response = await fetch('http://localhost:3001/client-files-staff/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                    // DO NOT set Content-Type header with FormData
                },
                body: formData
            });

            // Stop progress simulation
            clearInterval(progressInterval);
            
            // Check for non-2xx responses
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Server error: ${response.status}`);
            }

            // Parse the response
            const responseData = await response.json();
            
            console.log('Upload response:', responseData);

            // Verify the response has an id
            if (responseData && responseData.id) {
                uploadProgress.value = 100;
                showToast({
                    message: 'File uploaded successfully!',
                    type: 'success'
                });
                
                // Wait a moment to show 100% progress, then close the modal and refresh
                setTimeout(() => {
                    closeModal();
                    fetchFiles();
                }, 1000);
            } else {
                throw new Error('Invalid server response: missing ID');
            }
        } catch (error) {
            console.error('Complete upload error:', error);
            uploadError.value = error.message || 'Failed to upload file';
            uploadProgress.value = 0;
        } finally {
            // Make sure isUploading is set to false if the function completes
            // This makes sure the user can retry the upload if it fails
            if (uploadProgress.value !== 100) {
                isUploading.value = false;
            }
        }
    }

    function handleFileChange(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
        uploadError.value = 'Only JPG, PNG, and PDF files are allowed.';
        uploadForm.value.file = null;
        return;
    }
    
    // Check file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
        uploadError.value = 'File size exceeds 10MB limit.';
        uploadForm.value.file = null;
        return;
    }
    
    uploadForm.value.file = file;
    uploadError.value = '';
    }

    // Set up on component mount
    onMounted(async () => {
    debugToken();

    try {
        // Fetch the profile data
        await fetchProfile();
        
        // Fetch files for the current client
        await fetchFiles();
        
    } catch (err) {
        console.error('Error during component setup:', err);
    }

    // Also add a watcher for active tab
    watch(activeTab, (newTab) => {
            if (newTab === 'tab2' && currentClientId.value) {
                fetchConsultations(currentClientId.value);
            }
        });
    });

    // Watch for changes in the currentClientId
    watch(currentClientId, (newId) => {
        if (newId && activeTab.value === 'tab2') {
            fetchConsultations(newId);
        }
    });

</script>

<template>
<div class="bg-white shadow-md rounded-xl overflow-hidden mt-5">
    <div class="tabs-container">
    <!-- Tab Navigation -->
    <div class="tab-nav">
        <button 
        @click="activeTab = 'tab1'" 
        :class="['tab-button', activeTab === 'tab1' ? 'active' : '']"
        >
        Enrollment Files
        </button>
        <button 
        @click="activeTab = 'tab2'" 
        :class="['tab-button', activeTab === 'tab2' ? 'active' : '']"
        >
        Consultation Records
        </button>
    </div>
    
    <div class="tab-content">
        <!-- Enrollment Files -->
        <div v-if="activeTab === 'tab1'" class="tab-panel">
        <div class="p-6 border-b border-gray-100">
            <div class="flex items-center justify-between">
            <h2 class="text-lg font-medium text-[#2f4a71]">Your Files</h2>

            <button 
                @click="openModal" 
                class="p-1 pl-3 pr-3 font-bold text-white bg-[#2f4a71] rounded hover:bg-[#8b67db]"
            >
                Add Files
            </button>
            </div>
        </div>

        <!-- Files Grid -->
        <div class="p-6">
            <div v-if="loadingFiles" class="flex justify-center py-8">
            <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2f4a71]"></div>
            </div>
            
            <div v-else-if="clientFiles && clientFiles.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div 
                v-for="file in clientFiles" 
                :key="`${file.type}-${file.id}`" 
                class="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
                <div class="p-4">
                <div class="flex items-start">
                    <!-- File Type Icon -->
                    <div class="flex-shrink-0 mr-3">
                    <span 
                        :class="[
                        file.type === 'dental' ? 'bg-blue-100 text-blue-700' :
                        file.type === 'medical' ? 'bg-green-100 text-green-700' :
                        file.type === 'opthal' ? 'bg-purple-100 text-purple-700' :
                        file.type === 'physical' ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-700',
                        'inline-block p-2 rounded-md'
                        ]"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                    </span>
                    </div>
                    
                    <!-- File Info -->
                    <div class="flex-1 min-w-0">
                    <h3 class="text-sm font-medium text-gray-900 truncate">{{ formatFileType(file.type) }}</h3>
                    <p class="text-xs text-gray-400 mt-1">
                        {{ formatDate(file.date) }}
                    </p>
                    </div>
                </div>

                <div v-if="file.status" class="mt-2">
                    <span 
                        :class="[
                            getStatusClasses(file.status).bg,
                            getStatusClasses(file.status).text,
                            'px-2 py-1 text-xs rounded-full font-medium'
                        ]"
                    >
                        {{ formatStatus(file.status) }}
                    </span>
                </div>

                <!-- Notes (if available) -->
                <div v-if="file.notes" class="mt-2">
                    <p class="text-xs text-gray-600 italic">
                        <span class="font-medium">Note:</span> {{ file.notes }}
                    </p>
                </div>
            
                <!-- Actions -->
                <div class="mt-3 flex justify-end">
                    <button 
                    @click="viewFile(file)"
                    class="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2f4a71]"
                    >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View
                    </button>
                </div>
                </div>
            </div>
            </div>
            
            <!-- No Files State -->
            <div v-else class="p-6 text-center">
                <div class="p-8">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p class="mt-4 text-gray-500">No files found. Click "Add Files" to upload.</p>
                </div>
            </div>
        </div>
        </div>

        <!-- Tab 2 Content -->
        <div v-if="activeTab === 'tab2'" class="tab-panel">
            <div v-if="activeTab === 'tab2'" class="tab-panel p-4">
                
                <!-- Loading state -->
                <div v-if="consultationsLoading" class="flex justify-center py-8">
                    <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2f4a71]"></div>
                </div>
                
                <!-- Error state -->
                <div v-else-if="consultationsError" class="p-4 bg-red-50 text-red-700 rounded-md">
                    <p>{{ consultationsError }}</p>
                    <button 
                        @click="fetchConsultations(currentClientId)" 
                        class="mt-2 text-sm underline hover:text-red-800"
                    >
                        Try again
                    </button>
                </div>
                
                <!-- No records state -->
                <div v-else-if="consultations.length === 0" class="text-center py-12">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p class="mt-3 text-gray-500">No consultation records found</p>
                </div>
                
                <!-- Consultation records list -->
                <div v-else class="divide-y divide-gray-200">
                    <div v-for="record in consultations" :key="record.id" class="py-4 hover:bg-gray-50 transition-colors rounded-lg p-4">
                        <div class="flex justify-between items-start">
                            <div>
                                <div class="text-sm text-gray-500">{{ formatDate(record.date) }}</div>
                                <h3 class="font-medium text-lg text-[#2f4a71]">
                                    {{ record.diagnoses || 'General Consultation' }}
                                </h3>
                                <div class="mt-1 flex items-center">
                                    <span class="text-sm text-gray-600">Attended by: {{ record.doctor || 'School Physician' }}</span>
                                </div>
                            </div>
                            
                            <!-- Status indicators -->
                            <div class="flex space-x-2">
                                <span v-if="record.confined" class="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium">
                                    Confined
                                </span>
                                <span v-if="record.medAdministration" class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                                    Medication
                                </span>
                                <span v-if="record.intern" class="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full font-medium">
                                    Intern
                                </span>
                            </div>
                        </div>
                        
                        <!-- Enhanced details section with medication information -->
                        <details class="mt-2">
                            <summary class="text-sm text-[#2f4a71] cursor-pointer hover:underline focus:outline-none">
                                View details
                            </summary>
                            <div class="mt-3 ml-2 text-sm">
                                <!-- Complaint section -->
                                <div v-if="record.complaint" class="mb-2">
                                    <p class="font-medium text-gray-700">Complaint:</p>
                                    <p class="text-gray-600">{{ record.complaint }}</p>
                                </div>
                                
                                <!-- Medication section - show if there are any medications -->
                                <div v-if="record.medications && record.medications.length > 0" class="mb-2">
                                    <p class="font-medium text-gray-700">Medications:</p>
                                    <div class="mt-1 space-y-2">
                                        <div v-for="(medication, index) in record.medications" :key="medication.id" 
                                            class="flex items-start bg-blue-50 p-2 rounded">
                                            <div class="flex-shrink-0 h-5 w-5 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center mr-2 text-xs font-bold">
                                                {{ index + 1 }}
                                            </div>
                                            <div class="flex-1">
                                                <p class="font-medium">{{ medication.name }}</p>
                                                <div class="text-xs text-gray-600 mt-1">
                                                    <p><span class="font-medium">Quantity:</span> {{ medication.count }}</p>
                                                    <p><span class="font-medium">Schedule:</span> {{ medication.schedule }}</p>
                                                    <p><span class="font-medium">Duration:</span> {{ formatDate(medication.startDate) }} - {{ formatDate(medication.endDate) }}</p>
                                                    <p v-if="medication.remarks"><span class="font-medium">Notes:</span> {{ medication.remarks }}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Action Taken section -->
                                <div v-if="record.action" class="mb-2">
                                    <p class="font-medium text-gray-700">Action Taken:</p>
                                    <p class="text-gray-600">{{ record.action }}</p>
                                </div>
                                
                                <!-- Disposition section -->
                                <div v-if="record.disposition" class="mb-2">
                                    <p class="font-medium text-gray-700">Disposition:</p>
                                    <p class="text-gray-600">{{ record.disposition }}</p>
                                </div>
                                
                                <!-- Remarks section -->
                                <div v-if="record.remarks" class="mb-2">
                                    <p class="font-medium text-gray-700">Remarks:</p>
                                    <p class="text-gray-600">{{ record.remarks }}</p>
                                </div>
                            </div>
                        </details>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Access Denied Modal -->
    <div 
        v-if="showAccessDeniedModal" 
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        @click.self="closeAccessDeniedModal"
        >
        <div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
            <div class="p-6">
                <div class="flex items-center justify-center mb-6">
                    <div class="bg-red-100 rounded-full p-3">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-4V8m6 8l-3.5-2m-6 0L6 16m6-10c-.5 0-1.3.8-2.5 2-1 1-1.5 1-2.5 1V5a3 3 0 116 0z" />
                        </svg>
                    </div>
                </div>
                
                <h3 class="text-xl font-medium text-gray-900 text-center mb-2">Access Denied</h3>
                
                <p class="text-gray-600 text-center mb-6">
                    You can only view your own files. Please select a file that belongs to your account.
                </p>
                
                <div class="flex justify-center">
                    <button 
                        @click="closeAccessDeniedModal" 
                        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    </div>
    </div>
</div>

<!-- File Viewer Modal -->
<div 
    v-if="showViewerModal" 
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click.self="closeViewerModal"
>
    <div class="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 overflow-hidden h-5/6 flex flex-col">
    <!-- Modal Header -->
    <div class="flex justify-between items-center p-4 border-b">
        <h3 class="text-lg font-medium text-gray-900">{{ formatFileType(selectedFile?.type) }}</h3>
        <div class="flex items-center space-x-2">
            <!-- Download button -->
            <button 
            @click="downloadFile(selectedFile)" 
            class="text-gray-600 hover:text-gray-700 focus:outline-none"
            title="Download file"
            >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            </button>
            
            <!-- Close button -->
            <button 
            @click="closeViewerModal" 
            class="text-gray-400 hover:text-gray-500 focus:outline-none"
            >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            </button>
        </div>
    </div>

    
    <!-- Modal Body - File Viewer -->
    <div class="flex-grow p-2 overflow-hidden">
        <!-- Loading indicator -->
        <div v-if="fileLoading" class="flex items-center justify-center h-full">
            <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2f4a71]"></div>
        </div>
        
        <!-- File content -->
        <template v-else-if="selectedFile && selectedFile.url">
            <!-- PDF viewer -->
            <iframe 
            v-if="selectedFile.mimeType === 'application/pdf'" 
            :src="selectedFile.url" 
            class="w-full h-full border-0"
            title="PDF Viewer"
            ></iframe>
            
            <!-- Image viewer -->
            <div 
            v-else-if="selectedFile.isImage" 
            class="flex items-center justify-center h-full"
            >
            <img 
                :src="selectedFile.url" 
                :alt="selectedFile.fileName" 
                class="max-w-full max-h-full object-contain"
            />
            </div>
            
            <!-- Unsupported file type -->
            <div 
            v-else 
            class="flex flex-col items-center justify-center h-full"
            >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p class="mt-3 text-gray-600">Unsupported file type</p>
            </div>
        </template>
    </div>
    </div>
</div>

<!-- Modal for uploading files -->
<div 
    v-if="showModal" 
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click.self="closeModal()"
>
    <!-- Modal Container -->
    <div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
    <!-- Modal Header -->
    <div class="flex justify-between items-center p-4 border-b">
        <h3 class="text-lg font-medium text-gray-900">Upload Certificate</h3>
        <button 
        @click="closeModal" 
        class="text-gray-400 hover:text-gray-500 focus:outline-none"
        >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
        </button>
    </div>
    
    <!-- Modal Body - File Upload Form -->
    <div class="p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Upload Certificate Files</h3>
        
        <!-- Certificate Type Selection -->
        <div class="mb-4">
        <label for="certType" class="block text-sm font-medium text-gray-700 mb-1">Certificate Type</label>
        <select 
            id="certType"
            v-model="uploadForm.certType"
            class="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2f4a71]"
        >
            <option disabled value="">Select Certificate Type</option>
            <option v-for="type in certificateTypes" :key="type.value" :value="type.value">
            {{ type.label }}
            </option>
        </select>
        </div>
        
        <!-- File Upload -->
        <div class="mb-4">
        <label for="fileUpload" class="block text-sm font-medium text-gray-700 mb-1">Upload File</label>
        <div class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div class="space-y-1 text-center">
            <svg
                class="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
            >
                <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                />
            </svg>
            <div class="flex text-sm text-gray-600">
                <label
                for="file-upload"
                class="relative cursor-pointer bg-white rounded-md font-medium text-[#2f4a71] hover:text-[#8b67db] focus-within:outline-none"
                >
                <span>Upload a file</span>
                <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    class="sr-only"
                    @change="handleFileChange"
                />
                </label>
                <p class="pl-1">or drag and drop</p>
            </div>
            <p class="text-xs text-gray-500">PDF, PNG, JPG up to 10MB</p>
            </div>
        </div>
        <div v-if="uploadForm.file" class="mt-2 text-sm text-gray-600">
            Selected file: {{ uploadForm.file.name }}
        </div>
        <div v-if="uploadError" class="mt-2 text-sm text-red-500">
            {{ uploadError }}
        </div>
        </div>

        <!-- Upload Progress -->
        <div v-if="isUploading" class="mb-4">
        <div class="w-full bg-gray-200 rounded-full h-2.5">
            <div 
            class="bg-blue-600 h-2.5 rounded-full" 
            :style="{ width: `${uploadProgress}%` }"
            ></div>
        </div>
        <p class="text-sm text-gray-600 mt-1">Uploading: {{ uploadProgress }}%</p>
        </div>
    </div>

    <!-- Modal Footer -->
    <div class="px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse bg-gray-50">
        <button 
        @click="uploadFile" 
        class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-[#2f4a71] text-base font-medium text-white hover:bg-[#8b67db] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2f4a71] sm:ml-3 sm:w-auto sm:text-sm"
        :disabled="!isFormValid || isUploading"
        >
        Upload
        </button>
        <button 
        @click="closeModal" 
        class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
        >
        Cancel
        </button>
    </div>
    </div>
</div>
</template>

<style scoped>
.tabs-container {
  width: 100%;
  margin: 0 auto;
}

.tab-nav {
  display: flex;
  border-bottom: 1px solid #ccc;
  margin-bottom: 20px;
}

.tab-button {
  padding: 10px 20px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  border-bottom: 3px solid transparent;
  transition: all 0.3s ease;
}

.tab-button:hover {
  background-color: #f5f5f5;
}

.tab-button.active {
  border-bottom-color: #333;
  font-weight: bold;
}

.tab-content {
  padding: 20px 0;
}

.tab-panel {
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>