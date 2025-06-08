// Composable to provide access to inventory service
import { ref } from "vue";
import * as inventoryServiceFunctions from "~/services/inventoryService";

export function useInventoryService() {
  const loading = ref(false);
  const error = ref(null);

  // Wrap the original inventory service functions with error handling
  const fetchInventoryItems = async (type) => {
    loading.value = true;
    error.value = null;
    
    try {
      return await inventoryServiceFunctions.fetchInventoryItems(type);
    } catch (err) {
      console.error("Error in fetchInventoryItems:", err);
      error.value = err;
      return [];
    } finally {
      loading.value = false;
    }
  };

  // Add other wrapped inventory service functions as needed

  return {
    loading,
    error,
    fetchInventoryItems,
    // Export other functions as needed
    ...inventoryServiceFunctions
  };
}
