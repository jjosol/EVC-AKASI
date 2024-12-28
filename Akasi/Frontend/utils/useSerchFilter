import { ref, computed } from 'vue'

export const useSearch = <T>(items: T[]) => {
  const searchQuery = ref('')
  
  const filterItems = (field: keyof T) => {
    return computed(() => {
      if (!searchQuery.value) return items
      return items.filter(item => 
        String(item[field]).toLowerCase().includes(searchQuery.value.toLowerCase())
      )
    })
  }

  return {
    searchQuery,
    filterItems
  }
}