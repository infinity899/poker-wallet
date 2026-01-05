// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  // SPA mode - no server-side rendering
  ssr: false,

  // Modules
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@nuxtjs/supabase',
  ],

  // Supabase configuration
  supabase: {
    redirectOptions: {
      login: '/auth/login',
      callback: '/auth/confirm',
      exclude: ['/', '/auth/*'],
    },
  },

  // App configuration
  app: {
    head: {
      title: 'Poker Wallet',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no' },
        { name: 'description', content: 'Track your poker sessions and tournaments' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      ],
    },
  },

  // TypeScript configuration
  // Note: typeCheck disabled due to Supabase types not being auto-generated yet
  // Run `npx supabase gen types` after setting up Supabase project to enable
  typescript: {
    strict: true,
    typeCheck: false,
  },

  // Tailwind module options
  tailwindcss: {
    cssPath: '~/assets/css/tailwind.css',
    configPath: 'tailwind.config',
  },
});
