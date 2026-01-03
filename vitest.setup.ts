import { vi } from 'vitest';
import { computed, readonly, ref } from 'vue';

// Provide Vue globals that Nuxt auto-imports
vi.stubGlobal('ref', ref);
vi.stubGlobal('computed', computed);
vi.stubGlobal('readonly', readonly);
