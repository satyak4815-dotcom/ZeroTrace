/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        tactical: {
          dark: '#030712',
          surface: '#0a0f1d',
          card: '#0d1527',
          border: '#1e293b',
          accent: '#06b6d4',
          emerald: '#10b981',
          danger: '#ef4444',
          warning: '#f59e0b',
          orange: '#f97316',
          muted: '#64748b',
        },
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', '"Liberation Mono"', '"Courier New"', 'monospace'],
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scanline': 'scanline 8s linear infinite',
        'radar-sweep': 'radar-sweep 4s linear infinite',
        'blink': 'blink 1s step-start infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '1', filter: 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.8))' },
          '50%': { opacity: '0.4', filter: 'drop-shadow(0 0 2px rgba(239, 68, 68, 0.3))' },
        },
        'scanline': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' },
        },
        'radar-sweep': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'blink': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
      },
      boxShadow: {
        'neon-cyan': '0 0 15px -3px rgba(6, 182, 212, 0.3), 0 0 6px -2px rgba(6, 182, 212, 0.2)',
        'neon-emerald': '0 0 20px -3px rgba(16, 185, 129, 0.25), 0 0 8px -2px rgba(16, 185, 129, 0.2)',
        'neon-orange': '0 0 20px -3px rgba(249, 115, 22, 0.3), 0 0 8px -2px rgba(249, 115, 22, 0.2)',
        'neon-red': '0 0 20px -3px rgba(239, 68, 68, 0.4), 0 0 8px -2px rgba(239, 68, 68, 0.2)',
      },
    },
  },
  plugins: [],
};
