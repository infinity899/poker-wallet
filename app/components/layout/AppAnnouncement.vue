<template>
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="opacity-0 -translate-y-full"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition-all duration-200 ease-in"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 -translate-y-full"
  >
    <div
      v-if="currentAnnouncement"
      class="relative px-4 py-3 text-sm font-medium" :class="[
        typeClasses[currentAnnouncement.type],
      ]"
    >
      <div class="mx-auto flex max-w-7xl items-center justify-center gap-x-3">
        <component
          :is="typeIcons[currentAnnouncement.type]"
          class="h-5 w-5 flex-shrink-0"
        />
        <p class="text-center">
          {{ currentAnnouncement.message }}
        </p>
        <button
          v-if="currentAnnouncement.action"
          class="ml-2 rounded-md px-2 py-1 text-xs font-semibold underline underline-offset-2 hover:no-underline"
          @click="currentAnnouncement.action?.handler"
        >
          {{ currentAnnouncement.action.label }}
        </button>
      </div>
      <button
        v-if="currentAnnouncement.dismissible"
        class="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2"
        :class="dismissButtonClasses[currentAnnouncement.type]"
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
  info: 'bg-primary-600 text-white dark:bg-primary-500',
  warning: 'bg-warning-500 text-warning-950 dark:bg-warning-400 dark:text-warning-950',
  danger: 'bg-danger-600 text-white dark:bg-danger-500',
  success: 'bg-success-600 text-white dark:bg-success-500',
};

const dismissButtonClasses: Record<AnnouncementType, string> = {
  info: 'hover:bg-primary-700 focus:ring-primary-500 dark:hover:bg-primary-600',
  warning: 'hover:bg-warning-600 focus:ring-warning-500 dark:hover:bg-warning-500',
  danger: 'hover:bg-danger-700 focus:ring-danger-500 dark:hover:bg-danger-600',
  success: 'hover:bg-success-700 focus:ring-success-500 dark:hover:bg-success-600',
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
