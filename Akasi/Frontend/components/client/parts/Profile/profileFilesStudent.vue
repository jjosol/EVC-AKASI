<script setup>
    import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
    import { useProfile } from '~/composables/useProfile';
    import { usePatientConsultations } from '~/composables/usePatientConsultations';

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
    const isOpen = ref(false);
    const selectedGrade = ref('');
    const showViewerModal = ref(false);
    const selectedFile = ref(null);
    const fileError = ref('');
    const fileLoading = ref(false);
    const showAccessDeniedModal = ref(false);
    const imageLoadError = ref(false);

    // Status definitions with colors
    const statusColors = {
        'pending': { bg: 'bg-yellow-100', text: 'text-yellow-800' },
        'approved': { bg: 'bg-green-100', text: 'text-green-800' },
        'rejected': { bg: 'bg-red-100', text: 'text-red-800' },
        'under_review': { bg: 'bg-blue-100', text: 'text-blue-800' },
        'requires_update': { bg: 'bg-orange-100', text: 'text-orange-800' }
    };

    // Upload form data
    const uploadForm = ref({
        grade: '',
        certType: '',
        file: null
    });

    // Constants
    const grades = [
        'Grade 7',
        'Grade 8',
        'Grade 9',
        'Grade 10',
        'Grade 11',
        'Grade 12'
    ];

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
    if (!file || (!file.url && !file.blob)) {
        console.error('No file available to download');
        return;
    }

    try {
        const a = document.createElement('a');
        
        if (file.blob) {
            // If we have the blob directly, create an object URL from it
            const url = URL.createObjectURL(file.blob);
            a.href = url;
            a.download = file.fileName || `${file.type}_${file.id}.${getFileExtension(file)}`;
            document.body.appendChild(a);
            a.click();
            
            // Clean up
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
        } else if (file.url) {
            // If we already have a URL (typically an object URL from a blob)
            a.href = file.url;
            a.download = file.fileName || `${file.type}_${file.id}.${getFileExtension(file)}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    } catch (error) {
        console.error('Download error:', error);
    }
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

    // Set up on component mount
    onMounted(async () => {

        debugToken();

        try {
            // Fetch the profile data
            await fetchProfile();
            
            // Add event listener for clicking outside the dropdown
            document.addEventListener('click', handleClickOutside);
            
            // If profile has a grade, automatically select it
            if (profile.value && profile.value.grade) {
                const gradeIndex = profile.value.grade - 7; // Convert grade number to array index (7 -> 0, 8 -> 1, etc.)
                if (gradeIndex >= 0 && gradeIndex < grades.length) {
                    selectedGrade.value = grades[gradeIndex];
                    // Fetch files for this grade
                    fetchFiles(selectedGrade.value);
                }
            }
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

    // Clean up on component unmount
    onUnmounted(() => {
        document.removeEventListener('click', handleClickOutside);
    });

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

    // Add the consultations composable
    const { 
      consultations, 
      loading: consultationsLoading, 
      error: consultationsError,  
    } = usePatientConsultations();

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
    // Watch for changes in the selectedGrade and fetch certificates when it changes
    watch(selectedGrade, (newGrade) => {
        if (newGrade && currentClientId.value) {
            fetchFiles(newGrade);
        }
    });

    // Add this watch to update the uploadForm grade when selectedGrade changes
    watch(selectedGrade, (newGrade) => {
    if (newGrade) {
        // Update the form with the new grade number
        uploadForm.value.grade = getGradeNumber(newGrade);
    }
    });

    // Make sure this also runs when currentClientId changes
    watch(currentClientId, (newId) => {
        if (newId && activeTab.value === 'tab2') {
            fetchConsultations(newId);
        }
    });

    // Computed property to check if form is valid
    const isFormValid = computed(() => {
        return uploadForm.value.grade && 
            uploadForm.value.certType && 
            uploadForm.value.file;
    });

    // Updated viewFile function to use the correct endpoint
    // Updated viewFile function with better error handling and proper object URL management
async function viewFile(file) {
    try {
        fileLoading.value = true;
        fileError.value = '';
        imageLoadError.value = false;

        // Initialize with basic file info
        selectedFile.value = { 
            ...file,
            isImage: false,
            isLoading: true
        };
        
        showViewerModal.value = true;
        document.body.classList.add('overflow-hidden');
        
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Authentication token not found');

        console.log(`Requesting file: ${file.type}/${file.id}`);
        
        // Use the exact same endpoint string from student.vue
        const apiBaseUrl = process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:3001';
        
        // Make the request with proper authorization using the same endpoint as student.vue
        const response = await fetch(`${apiBaseUrl}/fetch-client-files-admin/file/${file.type}/${file.id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
        }
        
        // Retrieve the blob data
        const blob = await response.blob();
        console.log('Received blob size:', blob.size, 'type:', blob.type);
        
        if (blob.size === 0) {
            throw new Error('Received empty file data');
        }

        // Generate a unique URL for this blob
        const url = URL.createObjectURL(blob);
        
        // Detect the MIME type
        const mimeType = await detectMimeType(blob);
        console.log('Detected MIME type:', mimeType);
        
        // For very large image files, create a downsized version for preview
        let previewUrl = url;
        if (mimeType.startsWith('image/') && blob.size > 5000000) { // 5MB
            try {
                previewUrl = await createImagePreview(blob, 1200); // Max width 1200px
            } catch (previewError) {
                console.error('Failed to create preview:', previewError);
                // Fall back to original URL
                previewUrl = url;
            }
        }

        console.log('File details:', {
            isImage: mimeType.startsWith('image/'),
            mimeType,
            size: blob.size,
            url
        });
        
        // Update with file details
        selectedFile.value = {
            ...file,
            url: url,
            previewUrl: previewUrl,
            mimeType: mimeType,
            fileName: getFileNameFromType(file.type, file.id, mimeType),
            isImage: mimeType.startsWith('image/'),
            isPdf: mimeType === 'application/pdf',
            isVideo: mimeType.startsWith('video/'),
            size: blob.size,
            blob: blob,
            isLoading: false
        };

        console.log(selectedFile.value.blob, 'fignsrin')

    } catch (error) {
        console.error('Error viewing file:', error);
        fileError.value = error.message || 'Failed to load file';
        
        if (selectedFile.value?.url) {
            URL.revokeObjectURL(selectedFile.value.url);
        }
        
        if (selectedFile.value?.previewUrl && selectedFile.value.previewUrl !== selectedFile.value?.url) {
            URL.revokeObjectURL(selectedFile.value.previewUrl);
        }
        
        selectedFile.value = null;
    } finally {
        fileLoading.value = false;
    }
}

// Add this helper function to create smaller image previews for large images
async function createImagePreview(blob, maxWidth) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(blob);
        
        img.onload = () => {
            // Calculate new dimensions
            let width = img.width;
            let height = img.height;
            
            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }
            
            // Create canvas and resize
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            // Get resized image as blob
            canvas.toBlob((resizedBlob) => {
                // Cleanup
                URL.revokeObjectURL(url);
                
                if (resizedBlob) {
                    resolve(URL.createObjectURL(resizedBlob));
                } else {
                    reject(new Error('Failed to create preview'));
                }
            }, 'image/jpeg', 0.8);
        };
        
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load image for preview'));
        };
        
        img.src = url;
    });
}
        // Add this function to detect MIME type from file signature
        async function detectMimeType(blob) {
        // Only read the first few bytes to check the file signature
        const firstBytes = await blob.slice(0, 8).arrayBuffer(); // Read 8 bytes instead of 4
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
        
        // Use the blob's type instead of defaulting to PDF
        return blob.type || 'application/octet-stream';
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
        imageLoadError.value = false;
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

    // Close dropdown when clicking outside
    function handleClickOutside(event) {
        if (isOpen.value && !event.target.closest('.relative')) {
            isOpen.value = false;
        }
    }

    // Handle grade selection
    function selectGrade(grade) {
        selectedGrade.value = grade;
        isOpen.value = false;
        // Fetch files for the selected grade
        fetchFiles(grade);
    }

    // Extract grade number from grade text (e.g., 'Grade 7' -> 7)
    function getGradeNumber(gradeText) {
        return parseInt(gradeText.replace('Grade ', ''));
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
            grade: selectedGrade.value ? getGradeNumber(selectedGrade.value) : '',
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

    // Get the URL for viewing a file
    function getFileViewUrl(file) {
        return `http://localhost:3001/client-files/file/${file.type}/${file.id}`;
    }

    // File handling
    function handleFileChange(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Validate file type and size
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
        const maxSize = 10 * 1024 * 1024; // 10MB
        
        if (!allowedTypes.includes(file.type)) {
            uploadError.value = 'Invalid file type. Please upload PDF, JPG, or PNG.';
            return;
        }
        
        if (file.size > maxSize) {
            uploadError.value = 'File is too large. Maximum size is 10MB.';
            return;
        }
        
        uploadForm.value.file = file;
        uploadError.value = '';
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

    // Fetch files for a grade
    // Fixed fetchFiles function with updated endpoint URL to match backend controller
        async function fetchFiles(grade) {
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
            
            // Use the CORRECT endpoint which is 'fetch-client-files/all' as defined in the controller
            console.log('Fetching all client files first');
            
            const response = await fetch('http://localhost:3001/fetch-client-files/all', {
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
            
            const allFiles = await response.json();
            console.log(`Fetched ${allFiles.length} total files for the current user`);
            
            // Now filter the files by grade on the client side
            if (grade) {
            const gradeNumber = getGradeNumber(grade);
            console.log(`Filtering files for grade ${grade} (${gradeNumber})`);
            
            clientFiles.value = allFiles.filter(file => file.grade === gradeNumber);
            console.log(`Filtered to ${clientFiles.value.length} files for grade ${grade}`);
            } else {
            // If no grade specified, show all files
            clientFiles.value = allFiles;
            }
            
            // If we have files, clear any previous error
            if (clientFiles.value.length > 0) {
            fileError.value = '';
            } else {
            console.log(`No files found for grade ${grade}`);
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

    // Upload file to server (kept for reference, but not used as per requirements)
    // In your upload method
    async function uploadFile() {
    try {
        isUploading.value = true;
        uploadError.value = '';
        
        // Start progress simulation
        const progressInterval = simulateProgress();
        
        // Debug the token
        const token = localStorage.getItem('token');
        if (token) {
        // Decode the token to verify payload
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('Token payload:', payload);
        }

        // Ensure client_id is being sent correctly
        const formData = new FormData();
        
        // Ensure these match the backend expectation
        formData.append('file', uploadForm.value.file);
        formData.append('grade', uploadForm.value.grade.toString());
        formData.append('type', uploadForm.value.certType);
        
        // Get client ID from the computed property
        const clientId = currentClientId.value;
        console.log('Sending client ID:', clientId);
        
        formData.append('client_id', clientId.toString());

        console.log('Sending form data:', {
        file: uploadForm.value.file.name,
        grade: uploadForm.value.grade,
        type: uploadForm.value.certType,
        client_id: clientId
        });

        const response = await fetch('http://localhost:3001/client-files/upload', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
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
            fetchFiles(selectedGrade.value);
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

    // Add these new refs for confirmation modal
const showDeleteConfirmModal = ref(false);
const fileToDelete = ref(null);
const isDeleting = ref(false);
const deleteError = ref('');

// Function to check if the file can be deleted (only if file grade matches client grade)
function canDeleteFile(file) {
    if (!profile.value || !file) return false;
    
    // Get the client's current grade
    const clientGrade = profile.value.grade;
    
    // Check if file grade matches client's current grade
    return file.grade === clientGrade;
}

// Function to open the delete confirmation modal
function confirmDeleteFile(file) {
    fileToDelete.value = file;
    showDeleteConfirmModal.value = true;
}

// Function to close the delete confirmation modal
function closeDeleteConfirmModal() {
    showDeleteConfirmModal.value = false;
    fileToDelete.value = null;
    deleteError.value = '';
}

// Function to delete a file
async function deleteFile() {
    if (!fileToDelete.value) return;
    
    try {
        isDeleting.value = true;
        deleteError.value = '';
        
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Authentication token not found');
        }
        
        const response = await fetch('http://localhost:3001/client-files/delete/' + fileToDelete.value.id, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: fileToDelete.value.type
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Server error: ${response.status}`);
        }
        
        // Remove the deleted file from the clientFiles array
        clientFiles.value = clientFiles.value.filter(
            file => !(file.id === fileToDelete.value.id && file.type === fileToDelete.value.type)
        );
        
        // Show success message
        showToast({
            message: 'File deleted successfully!',
            type: 'success'
        });
        
        // Close modal
        closeDeleteConfirmModal();
        
    } catch (error) {
        console.error('Error deleting file:', error);
        deleteError.value = error.message || 'Failed to delete file';
    } finally {
        isDeleting.value = false;
    }
}

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
            <!-- Dropdown Select -->
            <div class="relative inline-block text-left">
                <div>
                <button 
                    @click="isOpen = !isOpen" 
                    type="button" 
                    class="inline-flex justify-between items-center w-56 rounded-md border border-gray-200 px-4 py-2 bg-white text-sm font-medium text-[#2f4a71] hover:bg-[#f8f4ff] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2f4a71]"
                >
                    {{ selectedGrade || 'Select Grade' }}
                    <svg class="-mr-1 ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a 1 1 0 111.414 1.414l-4 4a 1 1 0 01-1.414 0l-4-4a 1 1 0 010-1.414z" clip-rule="evenodd" />
                    </svg>
                </button>
                </div>

                <div 
                v-if="isOpen" 
                class="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 focus:outline-none z-10 max-h-48 overflow-y-auto"
                >
                <div class="py-1">
                    <a 
                    v-for="grade in grades" 
                    :key="grade" 
                    @click="selectGrade(grade)" 
                    class="block px-4 py-2 text-sm cursor-pointer hover:bg-[#f8f4ff]"
                    :class="selectedGrade === grade ? 'bg-[#f8f4ff] text-[#2f4a71] font-medium' : 'text-gray-700'"
                    >
                    {{ grade }}
                    </a>
                </div>
                </div>
            </div>

            <button 
                @click="openModal" 
                class="p-1 pl-3 pr-3 font-bold text-white bg-[#2f4a71] rounded hover:bg-[#8b67db]"
            >
                Add Files
            </button>
            </div>
        </div>

        <!-- Files Grid - Shows after grade selection -->
        <div v-if="selectedGrade" class="p-6">
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
                    <h3 class="text-sm font-medium text-gray-900 truncate">{{ file.typeLabel }}</h3>
                    <p class="text-xs text-gray-500">
                        Grade {{ file.grade }}
                    </p>
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
                <!-- Add this inside the Actions div, right after the View button -->
                    <div class="mt-3 flex justify-between">
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
                        
                        <!-- Delete button - only show if file grade matches client grade -->
                        <button 
                        v-if="canDeleteFile(file)"
                        @click.stop="confirmDeleteFile(file)"
                        class="inline-flex items-center px-2.5 py-1.5 border border-red-300 text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                        </button>
                    </div>
                </div>
            </div>
            </div>
            
            <div v-else class="text-center py-12">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p class="mt-3 text-gray-500">No certificates found for this grade</p>
            </div>
        </div>

        <!-- No Grade Selected State -->
        <div v-else class="p-6 text-center">
            <div class="p-8">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
            </svg>
            <p class="mt-4 text-gray-500">Please select a grade to view available certificates</p>
            </div>
        </div>
        </div>

        <!-- Tab 2 Content -->
        <div v-if="activeTab === 'tab2'" class="tab-panel p-4">
            <h2 class="text-xl font-medium mb-6 text-[#2f4a71]">Consultation Records</h2>
            
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
            
            <!-- Update the consultation records section in profileFilesStudent.vue -->
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
<!-- In your template section, replace the file viewer modal with this improved version -->
<div v-if="showViewerModal" class="fixed inset-0 z-50 overflow-hidden bg-black bg-opacity-75 flex items-center justify-center">
  <div class="bg-white rounded-lg w-11/12 md:w-4/5 max-w-4xl h-5/6 flex flex-col relative overflow-hidden">
    <!-- Modal header -->
    <div class="p-4 border-b flex justify-between items-center">
      <h3 class="text-lg font-medium">{{ selectedFile?.fileName || 'File Viewer' }}</h3>
      <div class="space-x-2">
        <button 
          v-if="selectedFile && !fileLoading" 
          @click="downloadFile(selectedFile)" 
          class="px-3 py-1 bg-blue-500 text-white rounded text-sm"
        >
          Download
        </button>
        <button @click="closeViewerModal" class="text-gray-500 hover:text-gray-800">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
    
    <!-- Modal body with viewer -->
    <div class="flex-1 overflow-auto p-4 bg-gray-50">
      <!-- Loading state -->
      <div v-if="fileLoading || selectedFile?.isLoading" class="h-full flex items-center justify-center">
        <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        <p class="ml-3 text-gray-600">Loading file...</p>
      </div>
      
      <!-- Error state -->
      <div v-else-if="fileError" class="h-full flex items-center justify-center">
        <div class="text-center p-6 bg-red-50 rounded-lg max-w-md">
          <svg class="w-12 h-12 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 class="text-lg font-medium text-red-800 mt-2">Failed to load file</h3>
          <p class="mt-1 text-red-600">{{ fileError }}</p>
        </div>
      </div>
      
      <!-- Image viewer -->
      <div 
        v-else-if="selectedFile?.isImage" 
        class="h-full flex items-center justify-center"
      >
        <div v-if="imageLoadError" class="text-center p-4 bg-red-50 rounded-lg">
          <p class="text-red-600 mb-2">Error displaying image. The file may be too large ({{ formatFileSize(selectedFile?.size || 0) }}).</p>
          <button 
            @click="downloadFile(selectedFile)"
            class="px-3 py-1 bg-blue-500 text-white rounded"
          >
            Download Instead {{ selectedFile.url }}
          </button>
        </div>
        <img 
          v-else
          :src="selectedFile.previewUrl || selectedFile.url" 
          :alt="selectedFile.fileName" 
          class="max-w-full max-h-full object-contain"
          @error="imageLoadError = true"
        />
      </div>
      
      <!-- PDF viewer -->
      <div v-else-if="selectedFile?.isPdf" class="h-full">
        <object 
          :data="selectedFile.url" 
          type="application/pdf" 
          class="w-full h-full"
          @error="fileError = 'PDF viewer not supported in this browser'"
        >
          <div class="flex flex-col items-center justify-center h-full text-center p-6 bg-gray-100 rounded-lg">
            <p class="mb-3">Your browser doesn't support PDF viewing.</p>
            <button 
              @click="downloadFile(selectedFile)"
              class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Download PDF
            </button>
          </div>
        </object>
      </div>
      
      <!-- Video viewer -->
      <div v-else-if="selectedFile?.isVideo" class="h-full flex items-center justify-center">
        <video 
          :src="selectedFile.url" 
          controls 
          class="max-w-full max-h-full"
          @error="fileError = 'Video playback failed'"
        >
          Your browser doesn't support video playback.
        </video>
      </div>
      
      <!-- Generic file (download only) -->
      <div v-else class="h-full flex items-center justify-center">
        <div class="text-center p-6 bg-gray-100 rounded-lg">
          <svg class="w-16 h-16 text-gray-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p class="mt-3 mb-4">This file type can't be previewed in the browser.</p>
          <button 
            @click="downloadFile(selectedFile)"
            class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Download File
          </button>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Modal for uploading files (kept for reference) -->
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
        
        <!-- Use currently selected grade -->
        <div v-if="selectedGrade" class="mb-4">
        <p class="text-sm font-medium text-gray-700">
            Uploading for: <span class="font-bold">{{ selectedGrade }}</span>
        </p>
        <input type="hidden" v-model="uploadForm.grade"/>
        </div>
        
        <!-- Or select grade if none is currently selected -->
        <div v-else class="mb-4">
        <label for="grade" class="block text-sm font-medium text-gray-700 mb-1">Grade</label>
        <select 
            id="grade"
            v-model="uploadForm.grade"
            class="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2f4a71]"
        >
            <option disabled value="">Select Grade</option>
            <option v-for="grade in grades" :key="grade" :value="getGradeNumber(grade)">
            {{ grade }}
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

<!-- Add this at the bottom of your template, after the upload modal -->
<!-- Delete Confirmation Modal -->
<div 
    v-if="showDeleteConfirmModal" 
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click.self="closeDeleteConfirmModal"
>
    <div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <!-- Modal Header -->
        <div class="flex justify-between items-center p-4 border-b">
            <h3 class="text-lg font-medium text-gray-900">Confirm Deletion</h3>
            <button 
                @click="closeDeleteConfirmModal" 
                class="text-gray-400 hover:text-gray-500 focus:outline-none"
            >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
        
        <!-- Modal Body -->
        <div class="p-6">
            <div class="flex items-center mb-4 text-red-600">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span class="text-lg font-medium">Are you sure?</span>
            </div>
            
            <p class="mb-4 text-gray-600">
                Are you sure you want to delete this 
                <span class="font-medium">{{ fileToDelete?.typeLabel || 'file' }}</span>? 
                This action cannot be undone.
            </p>
            
            <!-- Error message if delete fails -->
            <div v-if="deleteError" class="mb-4 p-2 bg-red-50 text-red-600 rounded">
                {{ deleteError }}
            </div>
            
            <div class="flex justify-end space-x-3">
                <button 
                    @click="closeDeleteConfirmModal"
                    class="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    :disabled="isDeleting"
                >
                    Cancel
                </button>
                <button 
                    @click="deleteFile"
                    class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    :disabled="isDeleting"
                >
                    <span v-if="isDeleting">
                        <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Deleting...
                    </span>
                    <span v-else>Delete</span>
                </button>
            </div>
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

/* Add styling for details summary element */
details summary {
  list-style: none;
  display: flex;
  align-items: center;
}

details summary::-webkit-details-marker {
  display: none;
}

details summary::before {
  content: '▶';
  font-size: 0.8em;
  margin-right: 0.5em;
  transition: transform 0.15s ease;
}

details[open] summary::before {
  transform: rotate(90deg);
}

/* Styling for medications list */
.medication-item {
  border-left: 3px solid #bfdbfe;
  padding-left: 8px;
  margin-bottom: 8px;
}

/* Create better spacing between medication details */
.medication-details p {
  margin-bottom: 2px;
}

</style>