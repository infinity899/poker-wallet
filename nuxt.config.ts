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

  // Runtime config
  // Note: Set NUXT_PUBLIC_EXCHANGE_RATE_API_KEY in your .env file
  runtimeConfig: {
    public: {
      exchangeRateApiKey: '',
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
        // Tints mobile browser chrome to match the app mark's tile.
        { name: 'theme-color', content: '#735FE9' },
      ],
      link: [
        // SVG first: browsers that support it pick it and render crisply at any
        // density. The .ico stays for those that don't, and for the bare
        // /favicon.ico request browsers and bookmark tools make regardless.
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/x-icon', sizes: '16x16 32x32 48x48', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
      ],
      script: [
        // Contentsquare session recording (production only)
        // eslint-disable-next-line node/prefer-global/process
        ...(process.env.NODE_ENV === 'production'
          ? [{ src: 'https://t.contentsquare.net/uxa/3e0d4faaabb9a.js', async: true }]
          : []),
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
