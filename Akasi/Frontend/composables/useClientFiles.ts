// composables/useClientFiles.ts
import { ref, computed } from 'vue'
import type { Ref } from 'vue'
import { useProfile } from '~/composables/useProfile'

interface CertificateFile {
    id: number;
    type: string;
    typeLabel: string;
    clientId: number;
    grade: number;
    date: string;
    url?: string;
}

export function useClientFiles() {
    const { profile } = useProfile()

    const certificateFiles: Ref<CertificateFile[]> = ref([])
    const loading = ref(false)
    const error = ref<string | null>(null)
    const selectedFile = ref<CertificateFile | null>(null)

    // Create a computed property that safely accesses the client ID
    const currentClientId = computed(() => {
        if (!profile.value) {
            console.log('Profile is null')
            return null
        }

        // Check all possible places where the ID might be stored
        if (profile.value.client_id !== undefined) {
            return profile.value.client_id
        }
        // If we're in development mode and using mock data
        return 1 // Default to ID 1 for testing
    })

    /**
     * Fetch certificates for a specific grade
     */
    async function fetchCertificates(grade: number) {
        if (!currentClientId.value) {
            error.value = 'Client ID not available'
            return []
        }

        try {
            loading.value = true
            error.value = null

            const token = localStorage.getItem('token')
            if (!token) {
                throw new Error('Authentication token not found')
            }

            const response = await fetch(`http://localhost:3001/client-files?client_id=${currentClientId.value}&grade=${grade}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (!response.ok) {
                throw new Error(`Failed to fetch certificates: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            certificateFiles.value = data
            return data
        } catch (err) {
            if (err instanceof Error) {
                error.value = err.message
            } else {
                error.value = String(err)
            }
            console.error('Error fetching certificates:', err)
            return []
        } finally {
            loading.value = false
        }
    }

    /**
     * View a file by creating a blob URL
     */
    async function viewFile(file: CertificateFile) {
        try {
            selectedFile.value = file

            const token = localStorage.getItem('token')
            if (!token) {
                throw new Error('Authentication token not found')
            }

            // Create a hidden iframe or fetch the file content and create a Blob URL
            const response = await fetch(`http://localhost:3001/client-files/file/${file.type}/${file.id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (!response.ok) {
                throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`)
            }

            // Get file content as blob
            const blob = await response.blob()

            // Create URL for the blob
            const url = URL.createObjectURL(blob)

            // Update the selected file with the URL
            selectedFile.value = {
                ...file,
                url
            }

            return selectedFile.value
        } catch (err) {
            if (err instanceof Error) {
                error.value = err.message
            } else {
                error.value = String(err)
            }
            console.error('Error viewing file:', err)
            return null
        }
    }

    /**
     * Clean up a blob URL
     */
    function revokeFileUrl(file: CertificateFile) {
        if (file && file.url) {
            URL.revokeObjectURL(file.url)
        }
    }

    /**
     * Get CSS class for the file icon based on file type
     */
    function getFileIconClass(type: string): string {
        const classes: Record<string, string> = {
            dental: 'bg-blue-100 text-blue-700',
            medical: 'bg-green-100 text-green-700',
            opthal: 'bg-purple-100 text-purple-700',
            physical: 'bg-orange-100 text-orange-700'
        }

        return classes[type] || 'bg-gray-100 text-gray-700'
    }

    /**
     * Format date for display
     */
    function formatDate(dateString: string): string {
        if (!dateString) return ''

        try {
            const date = new Date(dateString)
            const options: Intl.DateTimeFormatOptions = {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            }
            return date.toLocaleDateString('en-US', options)
        } catch (e) {
            return dateString
        }
    }

    return {
        certificateFiles,
        loading,
        error,
        selectedFile,
        currentClientId,
        fetchCertificates,
        viewFile,
        revokeFileUrl,
        getFileIconClass,
        formatDate
    }
}