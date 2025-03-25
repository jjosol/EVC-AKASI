<template>
    <SideBarA v-if="isAdmin"/>
    <SideBarC v-else-if="isClient"/>
    <SideBarM v-else-if="isManager"/>
    <slot />
</template>
<script setup>
import { useAuth } from '~/composables/useAuth';
const { isAdmin, isClient, isManager } = useAuth();

</script>