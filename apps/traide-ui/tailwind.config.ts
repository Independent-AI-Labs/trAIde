import type { Config } from 'tailwindcss'

export default {
  darkMode: ['class'],
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/pages/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        base: {
          950: '#0b0c10',
          900: '#0f1117',
          800: '#141823',
          700: '#1b2030',
          600: '#232a3b',
        },
        glass: {
          // darker glass base to prevent white-on-white
          bg: 'rgba(12,14,20,0.65)',
          stroke: 'rgba(255,255,255,0.10)',
          highlight: 'rgba(255,255,255,0.22)',
          shadow: 'rgba(0,0,0,0.45)',
        },
        accent: {
          purple: '#805ad5',
          teal: '#2dd4bf',
          pink: '#ff6ad5',
        },
      },
      boxShadow: {
        glass: 'inset 0 1px 0 rgba(255,255,255,0.2), 0 20px 40px rgba(0,0,0,0.35)',
        soft: '0 10px 30px rgba(0,0,0,0.25)',
      },
      backdropBlur: {
        xs: '2px',
      },
      backgroundImage: {
        'noise': "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"140\" height=\"140\" viewBox=\"0 0 140 140\"><filter id=\"n\"><feTurbulence type=\"fractalNoise\" baseFrequency=\"0.9\" numOctaves=\"4\" stitchTiles=\"stitch\"/></filter><rect width=\"100%\" height=\"100%\" filter=\"url(%23n)\" opacity=\"0.04\"/></svg>')",
        'radial-glow': 'radial-gradient(1000px 500px at 0% 0%, rgba(45,212,191,0.25), transparent), radial-gradient(1000px 500px at 100% 0%, rgba(128,90,213,0.25), transparent)',
        'sheen': 'linear-gradient(120deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 35%, rgba(255,255,255,0) 70%)',
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        pulseSoft: 'pulseSoft 2.2s ease-in-out infinite',
        sweep: 'sweep 3.5s linear infinite',
        wave: 'wave 2.4s ease-in-out infinite',
        spinFancy: 'spin 1.2s cubic-bezier(0.22, 1, 0.36, 1) infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: 0.9 },
          '50%': { opacity: 1 },
        },
        sweep: {
          '0%': { transform: 'translateX(-100%) skewX(-12deg)' },
          '100%': { transform: 'translateX(200%) skewX(-12deg)' },
        },
        wave: {
          '0%': { transform: 'translateX(-50%)' },
          '100%': { transform: 'translateX(0%)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config
