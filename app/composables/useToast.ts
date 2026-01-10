interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration: number;
}

// Global toast state (shared across all components)
const toasts = ref<Toast[]>([]);

/**
 * Toast notification composable
 * Provides a simple API for showing toast notifications
 */
export function useToast() {
  function show(type: Toast['type'], message: string, duration = 4000) {
    const id = crypto.randomUUID();
    toasts.value.push({ id, type, message, duration });

    if (duration > 0) {
      setTimeout(() => {
        dismiss(id);
      }, duration);
    }
  }

  function dismiss(id: string) {
    toasts.value = toasts.value.filter(t => t.id !== id);
  }

  function dismissAll() {
    toasts.value = [];
  }

  return {
    toasts: readonly(toasts),
    success: (message: string, duration?: number) => show('success', message, duration),
    error: (message: string, duration?: number) => show('error', message, duration ?? 6000),
    info: (message: string, duration?: number) => show('info', message, duration),
    warning: (message: string, duration?: number) => show('warning', message, duration ?? 5000),
    dismiss,
    dismissAll,
  };
}
