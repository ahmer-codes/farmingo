import type { Config } from 'tailwindcss'

export default {
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './composables/**/*.{js,ts}',
    './plugins/**/*.{js,ts}',
    './app.vue',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#1A4D2E',
          50: '#F2F7F3',
          100: '#E8F0EA',
          200: '#C5D9CB',
          300: '#8FB59A',
          400: '#5F8A6A',
          500: '#3A6B4A',
          600: '#1A4D2E',
          700: '#143D24',
          800: '#102F1C',
          900: '#0C2415',
        },
        amber: {
          DEFAULT: '#B86E14',
          50: '#FBF6EE',
          100: '#F8EFDF',
          200: '#EED6A8',
          300: '#DFB56A',
          400: '#D09235',
          500: '#B86E14',
          600: '#965910',
          700: '#74450E',
          800: '#5A360D',
        },
        ink: {
          DEFAULT: '#1F2420',
          secondary: '#4A524C',
          muted: '#6B746E',
        },
        canvas: '#F4F3EF',
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#EBE9E3',
        },
        line: {
          DEFAULT: '#DDD9D0',
          strong: '#C4BFB4',
        },
        danger: {
          DEFAULT: '#B42318',
          soft: '#F8E8E6',
        },
        soil: {
          50: '#F4F3EF',
          100: '#EBE9E3',
          200: '#DDD9D0',
          300: '#C4BFB4',
          400: '#9A958A',
          500: '#6B746E',
          600: '#4A524C',
          700: '#3A413C',
          800: '#2A302C',
          900: '#1F2420',
        },
        accent: {
          50: '#FBF6EE',
          100: '#F8EFDF',
          200: '#EED6A8',
          300: '#DFB56A',
          400: '#D09235',
          500: '#B86E14',
          600: '#965910',
          700: '#74450E',
          800: '#5A360D',
          900: '#462A0C',
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(31, 36, 32, 0.05)',
        panel: '0 1px 2px rgba(31, 36, 32, 0.05)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius-md)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-md)',
        xl: 'var(--radius-md)',
        full: '9999px',
      },
      maxWidth: {
        content: '72rem',
      },
      spacing: {
        sidebar: '15.25rem',
        header: '3.75rem',
        'bottom-nav': '4rem',
      },
    },
  },
  plugins: [],
} satisfies Config
