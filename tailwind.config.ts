import type { Config } from 'tailwindcss'

export default {
  content: [
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.{vue,js,ts}',
    './pages/**/*.{vue,js,ts}',
    './app.{vue,js,ts}',
    './plugins/**/*.{js,ts}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0b4336', // Brody green
          light: '#145e4a',
          dark: '#062820',
        },
      },
    },
  },
  plugins: [],
} satisfies Config

