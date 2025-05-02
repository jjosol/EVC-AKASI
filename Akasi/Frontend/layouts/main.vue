<style>
.left {
    height: 100%;
    width: 15%;
    position: fixed;
    z-index: 10;
    top: 0;
    overflow-x: hidden;
    left: 0;
    transition: all 0.3s ease;
}

.right {
    height: 100%;
    width: 85%;
    position: fixed;
    z-index: 1;
    top: 0;
    overflow-x: hidden;
    right: 0;
    transition: all 0.3s ease;
}

.centered {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
}

/* Mobile navigation toggle button */
.mobile-nav-toggle {
    display: none;
    position: fixed;
    top: 10px;
    left: 10px;
    z-index: 50;
    background-color: #2f4a71;
    color: white;
    border: none;
    border-radius: 5px;
    padding: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
}

/* Media queries for responsive design */
@media screen and (max-width: 768px) {
    .left {
        width: 70%;
        transform: translateX(-100%);
        /* Changed from left to transform for better animation */
        box-shadow: 2px 0 5px rgba(0, 0, 0, 0.2);
    }

    .left.active {
        transform: translateX(0);
        /* Show sidebar when active */
    }

    .right {
        width: 100%;
        left: 0;
        right: auto;
        transition: all 0.3s ease;
    }

    .mobile-nav-toggle {
        display: block;
    }

    .mobile-nav-toggle.active {
        left: 10px;
        /* Keep it in the same position */
    }

    /* When sidebar is active, push content slightly */
    .right.sidebar-active {
        transform: translateX(70%);
        opacity: 0.5;
        pointer-events: none;
    }
}

/* Add this to prevent body scrolling when sidebar is open on mobile */
body.sidebar-open {
    overflow: hidden;
}
</style>
<template>
    <button class="mobile-nav-toggle" :class="{ 'active': sidebarActive }" @click="toggleSidebar"
        aria-label="Toggle navigation">
        <span>☰</span>
    </button>

    <div class="split left" :class="{ 'active': sidebarActive }">
        <div class="center">
            <SideBarA v-if="isNurse" />
            <SideBarC v-else-if="isPatient" />
            <SideBarD v-else-if="isDoctor" />
        </div>
    </div>

    <div class="split right" :class="{ 'sidebar-active': sidebarActive }" @click="closeSidebarIfClickOutside">
        <div class="center">
            <slot />
        </div>
    </div>
</template>
<script setup>
import { ref, onMounted, onBeforeUnmount, provide } from 'vue';
import { useAuth } from '~/composables/useAuth';
const { isNurse, isPatient, isDoctor } = useAuth();

// Mobile sidebar state management
const sidebarActive = ref(false);
const isMobile = ref(false);

// Provide these values to child components
provide('sidebarActive', sidebarActive);
provide('isMobile', isMobile);

const toggleSidebar = () => {
    sidebarActive.value = !sidebarActive.value;
    // Add a class to body to prevent scrolling when sidebar is open
    if (sidebarActive.value) {
        document.body.classList.add('sidebar-open');
    } else {
        document.body.classList.remove('sidebar-open');
    }
};

const closeSidebarIfClickOutside = (event) => {
    // If sidebar is active and we're on mobile, clicking the overlay should close the sidebar
    if (sidebarActive.value && isMobile.value) {
        sidebarActive.value = false;
        document.body.classList.remove('sidebar-open');
    }
};

const closeSidebarIfMobile = (event) => {
    // If we clicked a link in the sidebar and we're on mobile, close the sidebar
    if (isMobile.value && event.target.tagName === 'A') {
        sidebarActive.value = false;
    }
};

// Check if the device is mobile based on screen width
const checkMobile = () => {
    isMobile.value = window.innerWidth <= 768;
    // On larger screens, always show sidebar
    if (!isMobile.value) {
        sidebarActive.value = false; // Reset to default state
    }
};

onMounted(() => {
    checkMobile();
    window.addEventListener('resize', checkMobile);
});

onBeforeUnmount(() => {
    window.removeEventListener('resize', checkMobile);
});
</script>