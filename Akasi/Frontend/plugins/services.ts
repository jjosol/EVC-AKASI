// Plugin to register services globally
import { defineNuxtPlugin } from "#app";

export default defineNuxtPlugin(() => {
  // This plugin ensures that the service files are included in the build
  console.log("Services plugin initialized");
});
