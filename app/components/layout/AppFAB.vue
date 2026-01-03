<template>
  <div class="fab-container fixed z-50" :class="isMobile ? 'bottom-20 right-4' : 'bottom-8 right-8'">
    <!-- Menu Items -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 translate-y-4"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-4"
    >
      <div v-if="showMenu" class="absolute bottom-16 right-0 flex flex-col gap-3 items-end mb-2">
        <button
          v-for="item in menuItems"
          :key="item.path"
          class="flex items-center gap-3 pr-4 pl-3 py-2 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:shadow-xl dark:shadow-gray-900/50 transition-shadow"
          @click="handleMenuItemClick(item.path)"
        >
          <div class="w-8 h-8 rounded-full flex items-center justify-center" :class="[item.color]">
            <PlusIcon class="w-4 h-4 text-white" />
          </div>
          <span class="text-sm font-medium text-gray-700 dark:text-gray-200 whitespace-nowrap">{{ item.label }}</span>
        </button>
      </div>
    </Transition>

    <!-- FAB Button -->
    <button
      class="w-14 h-14 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 hover:shadow-xl flex items-center justify-center transition-all active:scale-95"
      :class="{ 'rotate-45': showMenu }"
      @click="handleFabClick"
    >
      <PlusIcon class="w-6 h-6 transition-transform" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { PlusIcon } from '@heroicons/vue/24/solid';

const emit = defineEmits<{
  click: [];
}>();

const { isMobile } = useBreakpoint();

const showMenu = ref(false);
const router = useRouter();

const menuItems = [
  { label: 'Cash Session', path: '/sessions/new', color: 'bg-success-500' },
  { label: 'Tournament', path: '/tournaments/new', color: 'bg-primary-500' },
];

function handleFabClick() {
  if (isMobile.value) {
    showMenu.value = !showMenu.value;
  }
  else {
    emit('click');
  }
}

function handleMenuItemClick(path: string) {
  showMenu.value = false;
  router.push(path);
}

// Close menu when clicking outside
function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement;
  if (!target.closest('.fab-container')) {
    showMenu.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>
