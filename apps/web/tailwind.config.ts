import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#1a1a2e',
          raised: '#16213e',
          overlay: '#0f3460',
        },
        accent: {
          DEFAULT: '#e94560',
          hover: '#c73652',
          muted: '#e9456033',
        },
        track: {
          1: '#4a9eff',
          2: '#ff6b9d',
          3: '#7cfc00',
          4: '#ffa500',
          5: '#da70d6',
          6: '#00ced1',
          7: '#ff4500',
          8: '#adff2f',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config
