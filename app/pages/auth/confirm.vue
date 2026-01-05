<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
    <div class="text-center">
      <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-600 text-white text-2xl font-bold mb-4">
        P
      </div>
      <h1 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        {{ message }}
      </h1>
      <p v-if="!error" class="text-gray-600 dark:text-gray-400">
        Redirecting you to the dashboard...
      </p>
      <p v-else class="text-red-500">
        {{ error }}
      </p>
      <NuxtLink
        v-if="error"
        to="/auth/login"
        class="mt-4 inline-block text-primary-600 hover:text-primary-500"
      >
        Back to login
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false,
});

const router = useRouter();
const supabase = useSupabaseClient();

const message = ref('Confirming your account...');
const error = ref('');

onMounted(async () => {
  try {
    // Handle the OAuth or email confirmation callback
    const { data, error: authError } = await supabase.auth.getSession();

    if (authError) {
      throw authError;
    }

    if (data.session) {
      message.value = 'Account confirmed!';
      // Small delay to show the success message
      setTimeout(() => {
        router.push('/');
      }, 1000);
    }
    else {
      // No session found, try to exchange the code
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');

      if (accessToken) {
        message.value = 'Account confirmed!';
        setTimeout(() => {
          router.push('/');
        }, 1000);
      }
      else {
        error.value = 'No session found. Please try logging in again.';
      }
    }
  }
  catch (e: any) {
    error.value = e.message || 'Failed to confirm account';
  }
});
</script>
