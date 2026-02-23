// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-09-19',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  nitro: {
    preset: 'cloudflare_module',
    cloudflare: {
      // Match sefaria-tutor pattern: use Node.js compatibility for Workers
      nodeCompat: true,
      deployConfig: false,
    },
  },
  app: {
    head: {
      title: 'Brody Country Club - Order',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no' },
      ],
    },
  },
  runtimeConfig: {
    adminPassword: process.env.NUXT_ADMIN_PASSWORD || '',
    stationPassword: process.env.NUXT_STATION_PASSWORD || '',
    public: {},
  },
})
