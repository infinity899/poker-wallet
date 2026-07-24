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
      <div v-if="showMenu" class="absolute bottom-16 right-0 flex flex-col gap-2 items-end mb-2">
        <button
          v-for="item in menuItems"
          :key="item.id"
          class="flex items-center gap-3 pr-4 pl-3 py-2 bg-surface dark:bg-surface-dark-secondary rounded-full shadow-sm border border-border dark:border-border-dark hover:border-border-strong dark:hover:border-border-dark-strong transition-all"
          @click="handleMenuItemClick(item)"
        >
          <div class="w-7 h-7 rounded-full flex items-center justify-center" :class="[item.color]">
            <PlusIcon class="w-3.5 h-3.5 text-white" />
          </div>
          <span class="text-sm font-medium text-foreground dark:text-foreground-dark whitespace-nowrap">{{ item.label }}</span>
        </button>
      </div>
    </Transition>

    <!-- FAB Button -->
    <button
      class="w-12 h-12 bg-accent-600 dark:bg-accent-500 text-white rounded-full shadow-md hover:bg-accent-700 dark:hover:bg-accent-600 flex items-center justify-center transition-all duration-150 active:scale-95"
      :class="{ 'rotate-45': showMenu }"
      @click="handleFabClick"
    >
      <PlusIcon class="w-5 h-5 transition-transform" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { PlusIcon } from '@heroicons/vue/24/solid';

interface MenuItem {
  id: string;
  label: string;
  color: string;
  path?: string;
  action?: string;
}

const emit = defineEmits<{
  click: [];
  action: [action: string];
}>();

const { isMobile } = useBreakpoint();

const showMenu = ref(false);
const router = useRouter();

const menuItems: MenuItem[] = [
  { id: 'cash', label: 'Cash Session', path: '/sessions/new', color: 'bg-success-500' },
  { id: 'tournament', label: 'Tournament', path: '/tournaments/new', color: 'bg-violet-500' },
  { id: 'tournament-session', label: 'Tournament Session', action: 'logTournamentSession', color: 'bg-purple-500' },
  { id: 'trip', label: 'Trip', path: '/trips/new', color: 'bg-sky-500' },
];

function handleFabClick() {
  showMenu.value = !showMenu.value;
}

function handleMenuItemClick(item: MenuItem) {
  showMenu.value = false;
  if (item.path) {
    router.push(item.path);
  }
  else if (item.action) {
    emit('action', item.action);
  }
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
