<template>
  <div v-if="!authStore.isDemoMode" class="card p-5">
    <h2 class="text-sm font-semibold text-foreground dark:text-foreground-dark mb-4">
      Desktop app password
    </h2>

    <p class="text-xs text-foreground-muted dark:text-foreground-dark-muted mb-4">
      The desktop companion signs in with your email and a password. Set one here &mdash; Google sign-in keeps working.
    </p>

    <div class="mb-4">
      <label class="label">Account email</label>
      <p class="text-sm text-foreground dark:text-foreground-dark font-mono">
        {{ accountEmail || '—' }}
      </p>
    </div>

    <form class="space-y-4" @submit.prevent="handleSubmit">
      <div>
        <label class="label">New password</label>
        <input
          v-model="form.password"
          type="password"
          autocomplete="new-password"
          class="input"
          :class="{ 'input-error': errors.password }"
        >
        <p v-if="errors.password" class="mt-1 text-xs text-danger-600 dark:text-danger-400">
          {{ errors.password }}
        </p>
      </div>

      <div>
        <label class="label">Confirm password</label>
        <input
          v-model="form.confirmPassword"
          type="password"
          autocomplete="new-password"
          class="input"
          :class="{ 'input-error': errors.confirmPassword }"
        >
        <p v-if="errors.confirmPassword" class="mt-1 text-xs text-danger-600 dark:text-danger-400">
          {{ errors.confirmPassword }}
        </p>
      </div>

      <button type="submit" class="btn-primary" :disabled="saving">
        {{ saving ? 'Saving…' : 'Set password' }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
const authStore = useAuthStore();
const supabase = useSupabaseClient();
const user = useSupabaseUser();
const toast = useToast();

const accountEmail = computed(() => user.value?.email);

const form = reactive({
  password: '',
  confirmPassword: '',
});

const errors = reactive<Record<string, string>>({});
const saving = ref(false);

function validate() {
  errors.password = '';
  errors.confirmPassword = '';

  if (form.password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  }
  if (form.confirmPassword !== form.password) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return !errors.password && !errors.confirmPassword;
}

async function handleSubmit() {
  if (saving.value || !validate()) {
    return;
  }

  saving.value = true;
  try {
    const { error } = await supabase.auth.updateUser({ password: form.password });

    if (error) {
      toast.error(error.message);
      return;
    }

    form.password = '';
    form.confirmPassword = '';
    toast.success('Password set');
  }
  finally {
    saving.value = false;
  }
}
</script>
