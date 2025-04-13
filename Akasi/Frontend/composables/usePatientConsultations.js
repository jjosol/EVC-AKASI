import { ref, computed } from 'vue'

export function usePatientConsultations() {
    const consultations = ref([])
    const loading = ref(false)
    const error = ref(null)

    /**
     * Format date to a readable string
     */
    const formatDate = (dateString) => {
        if (!dateString) return '-'
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    /**
     * Fetch consultation records for the current patient
     */
    const fetchConsultations = async (patientId) => {
        if (!patientId) {
            error.value = 'Patient ID is required'
            return
        }

        try {
            loading.value = true
            error.value = null

            const token = localStorage.getItem('token')
            if (!token) {
                throw new Error('Authentication token not found')
            }

            // Log the URL we're calling
            const url = `http://localhost:3001/consultation-records/patient/${patientId}`
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
            error.value = err.message || 'Failed to load consultation records'
        } finally {
            loading.value = false
        }
    }

    return {
        consultations,
        loading,
        error,
        fetchConsultations,
        formatDate
    }
}