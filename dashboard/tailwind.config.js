/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        // TV-optimized sizes (viewed from 6-15 feet)
        'tv-xs': ['1.5rem', { lineHeight: '2rem' }],      // 24px
        'tv-sm': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
        'tv-base': ['2.25rem', { lineHeight: '2.75rem' }], // 36px
        'tv-lg': ['3rem', { lineHeight: '3.5rem' }],      // 48px
        'tv-xl': ['4rem', { lineHeight: '4.5rem' }],      // 64px
        'tv-2xl': ['5rem', { lineHeight: '5.5rem' }],     // 80px
        'tv-3xl': ['6rem', { lineHeight: '6.5rem' }],     // 96px
        'tv-clock': ['10rem', { lineHeight: '1' }],       // 160px for main clock
        // Glassmorphism optimized sizes
        'glass-time': ['8rem', { lineHeight: '1' }],      // 128px
        'glass-greeting': ['3.5rem', { lineHeight: '1.2' }], // 56px
        'glass-subtitle': ['2rem', { lineHeight: '1.3' }], // 32px
      },
      colors: {
        // Calendar colors (Kitchen Command Center - 11 family calendars)
        calendar: {
          home: '#00BCD4',      // Cyan
          kristine: '#E91E63',  // Pink
          kristineWork: '#9C27B0', // Purple
          corby: '#34A853',     // Green
          corbyWork: '#3F51B5', // Indigo
          corbyBode: '#009688', // Teal
          mccoy: '#FBBC05',     // Yellow
          knox: '#EA4335',      // Red
          ripley: '#FF6D01',    // Orange
          holidays: '#607D8B',  // Gray
          wrestling: '#9C27B0', // Purple
        },
        // Dashboard colors
        dash: {
          bg: '#0a0a0a',
          card: '#1a1a1a',
          border: '#2a2a2a',
          text: '#f5f5f5',
          muted: '#a3a3a3',
          accent: '#3b82f6',
        },
        // Glassmorphism colors
        glass: {
          white: 'rgba(255, 255, 255, 0.1)',
          dark: 'rgba(0, 0, 0, 0.3)',
          border: 'rgba(255, 255, 255, 0.15)',
        }
      },
      backdropBlur: {
        'glass': '12px',
        'glass-heavy': '20px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'ken-burns': 'kenBurns 20s ease-in-out infinite alternate',
        'fade-slow': 'fadeIn 1s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        kenBurns: {
          '0%': { transform: 'scale(1) translate(0, 0)' },
          '100%': { transform: 'scale(1.1) translate(-2%, -2%)' },
        },
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0, 0, 0, 0.3)',
        'text': '0 2px 4px rgba(0, 0, 0, 0.5)',
      },
    },
  },
  plugins: [],
}
