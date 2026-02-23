// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-02-23',
  devtools: { enabled: true },
  nitro: {
    preset: 'cloudflare_module',
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
