import { defineNuxtRouteMiddleware, navigateTo } from 'nuxt/app';
import { useProfile } from '~/composables/useProfile';
import { useAuth } from '~/composables/useAuth';

export default defineNuxtRouteMiddleware(async (to) => {
  if (process.server) return;

  console.log('🚀 Student-Grade Middleware Running');

  // Use auth for checking authentication only
  const { checkToken, isClient } = useAuth();

  if (!checkToken()) {
    console.log('❌ User not authenticated, redirecting to login');
    return navigateTo('/login');
  }

  // Log client check
  console.log('📋 Is client?', isClient.value);

  if (!isClient.value) {
    console.log('⚠️ Not a client, skipping grade check');
    return;
  }

  // Use profile for detailed user data - FIX: Get the profile ref directly
  const { profile, fetchProfile } = useProfile();
  
  // If profile isn't loaded yet, fetch it
  if (!profile.value) {
    await fetchProfile();
  }

  console.log('📝 Full profile data:', profile.value);

  // Check if the user is a student with grade 13+
  if (profile.value && isClient.value) {
    const category = profile.value.category;
    const grade = profile.value.grade;

    console.log('🎓 Student check from profile:', {
      category: category?.toLowerCase(),
      isStudent: category?.toLowerCase() === 'student',
      grade: grade,
      isGradeRestricted: grade !== null && grade >= 13
    });

    // Only apply check to clients who are students with grade 13+
    if (
      category?.toLowerCase() === 'student' &&
      grade !== null &&
      grade >= 13
    ) {
      console.log('🚫 Access denied: Student with grade 13+ trying to access services');
      return navigateTo('/bulletin?message=gradeRestriction');
    }
  } else {
    console.log('⚠️ Profile not found or not a client');
  }

  console.log('✅ Student-grade check passed, allowing access to services page');
});