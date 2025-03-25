import { ref } from 'vue';

// Create a reactive reference that can be shared across components
const lastBackupRestored = ref<string | null>(null);

export function useBackupEvents() {
  // Function to emit a backup restored event
  function emitBackupRestored() {
    // Update the timestamp to trigger reactive updates
    lastBackupRestored.value = new Date().toISOString();
  }

  return {
    lastBackupRestored,
    emitBackupRestored
  };
}