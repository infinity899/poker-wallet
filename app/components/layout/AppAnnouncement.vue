<template>
  <Transition
    enter-active-class="transition-all duration-200 ease-out"
    enter-from-class="opacity-0 -translate-y-full"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition-all duration-150 ease-in"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 -translate-y-full"
  >
    <div
      v-if="currentAnnouncement"
      class="relative px-4 py-2.5 text-sm font-medium"
      :class="[typeClasses[currentAnnouncement.type]]"
    >
      <div class="mx-auto flex max-w-7xl items-center justify-center gap-x-3">
        <component
          :is="typeIcons[currentAnnouncement.type]"
          class="h-4 w-4 flex-shrink-0"
        />
        <p class="text-center">
          {{ currentAnnouncement.message }}
        </p>
        <button
          v-if="currentAnnouncement.action"
          class="ml-1 text-xs font-medium underline underline-offset-2 hover:no-underline opacity-90 hover:opacity-100 transition-opacity"
          @click="currentAnnouncement.action?.handler"
        >
          {{ currentAnnouncement.action.label }}
        </button>
      </div>
      <button
        v-if="currentAnnouncement.dismissible"
        class="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 opacity-60 hover:opacity-100 transition-opacity focus:outline-none"
        @click="dismiss(currentAnnouncement.id)"
      >
        <XMarkIcon class="h-4 w-4" />
        <span class="sr-only">Dismiss</span>
      </button>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import type { AnnouncementType } from '~/composables/useAnnouncements';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/vue/24/outline';

const { currentAnnouncement, dismissAnnouncement } = useAnnouncements();

const typeClasses: Record<AnnouncementType, string> = {
  info: 'bg-slate-800 text-slate-100 dark:bg-slate-700',
  warning: 'bg-warning-500 text-warning-950',
  danger: 'bg-danger-600 text-white dark:bg-danger-500',
  success: 'bg-success-600 text-white dark:bg-success-500',
};

const typeIcons: Record<AnnouncementType, typeof InformationCircleIcon> = {
  info: InformationCircleIcon,
  warning: ExclamationTriangleIcon,
  danger: XCircleIcon,
  success: CheckCircleIcon,
};

function dismiss(id: string) {
  dismissAnnouncement(id);
}
</script>
