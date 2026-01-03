<script setup lang="ts">
// Initialize stores on app mount
const sessionsStore = useSessionsStore()
const tournamentsStore = useTournamentsStore()
const referenceStore = useReferenceStore()

onMounted(async () => {
  await Promise.all([
    sessionsStore.initialize(),
    tournamentsStore.initialize(),
    referenceStore.initialize()
  ])
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
