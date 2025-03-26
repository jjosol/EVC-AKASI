<style>
.left {
    height: 100%;
    width: 15%;
    position: fixed;
    z-index: 1;
    top: 0;
    overflow-x: hidden;
    left: 0;
    
}

.right {
    height: 100%;
    width: 85%;
    position: fixed;
    z-index: 1;
    top: 0;
    overflow-x: hidden;
    right: 0;

}

.centered {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
}
</style>
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