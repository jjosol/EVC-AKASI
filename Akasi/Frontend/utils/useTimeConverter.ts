import { computed } from 'vue'
import moment from 'moment-timezone'

export const useDateTime = () => {
  const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  const getCurrentDateTime = computed(() => {
    const now = moment().tz("Asia/Manila")
    return now.format('YYYY-MM-DD HH:mm:ss')
  })

  const formatDisplayDate = (date: Date): string => {
    return moment(date).format('MMMM D, YYYY')
  }

  return {
    formatDate,
    getCurrentDateTime,
    formatDisplayDate
  }
}