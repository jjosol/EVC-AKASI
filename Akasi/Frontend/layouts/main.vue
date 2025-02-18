<template>
    <SideBarA v-if="isAdmin"/>
    <SideBarC v-else-if="isClient"/>
    <slot />
</template>
<script setup>
import { useAuth } from '~/composables/useAuth';
const { isAdmin, isClient } = useAuth();

</script>