export type AnnouncementType = 'info' | 'warning' | 'danger' | 'success';

export interface Announcement {
  id: string;
  message: string;
  type: AnnouncementType;
  dismissible?: boolean;
  action?: {
    label: string;
    handler: () => void;
  };
}

const DISMISSED_KEY = 'poker-wallet-dismissed-announcements';

const announcements = ref<Announcement[]>([]);
const dismissedIds = ref<Set<string>>(new Set());

// Load dismissed IDs from localStorage
function loadDismissed() {
  if (typeof window === 'undefined') {
    return;
  }
  const stored = localStorage.getItem(DISMISSED_KEY);
  if (stored) {
    try {
      dismissedIds.value = new Set(JSON.parse(stored));
    }
    catch {
      dismissedIds.value = new Set();
    }
  }
}

// Save dismissed IDs to localStorage
function saveDismissed() {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem(DISMISSED_KEY, JSON.stringify([...dismissedIds.value]));
}

export function useAnnouncements() {
  // Initialize on first use
  onMounted(() => {
    loadDismissed();
  });

  const visibleAnnouncements = computed(() =>
    announcements.value.filter(a => !dismissedIds.value.has(a.id)),
  );

  const currentAnnouncement = computed(() =>
    visibleAnnouncements.value[0] ?? null,
  );

  function addAnnouncement(announcement: Omit<Announcement, 'id'> & { id?: string }) {
    const id = announcement.id ?? crypto.randomUUID();
    const exists = announcements.value.some(a => a.id === id);
    if (!exists) {
      announcements.value.push({
        ...announcement,
        id,
        dismissible: announcement.dismissible ?? true,
      });
    }
  }

  function removeAnnouncement(id: string) {
    announcements.value = announcements.value.filter(a => a.id !== id);
  }

  function dismissAnnouncement(id: string) {
    dismissedIds.value.add(id);
    saveDismissed();
  }

  function clearDismissed() {
    dismissedIds.value.clear();
    saveDismissed();
  }

  return {
    announcements: visibleAnnouncements,
    currentAnnouncement,
    addAnnouncement,
    removeAnnouncement,
    dismissAnnouncement,
    clearDismissed,
  };
}
