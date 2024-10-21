export default defineNuxtConfig({
  devtools: { enabled: true },

  imports: {
    autoImport: false,
  },

  future: {
    compatibilityVersion: 4,
  },

  devServer: {
    port: 5173,
  },

  ssr: false,

  nitro: {
    preset: 'vercel',
    vercel: {
      regions: ['fra1'],
    },
  },

  app: {
    head: {
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      title: 'Sessioned EOA',
      meta: [{ name: 'title', content: 'Sessioned EOA' }],
    },
  },

  modules: ['@vueuse/nuxt', '@nuxt/eslint'],
  compatibilityDate: '2024-07-16',
});
