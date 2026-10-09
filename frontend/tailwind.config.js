/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    fontFamily: {
      sans: ['Roboto', 'Open Sans', 'system-ui', 'sans-serif'],
    },
    extend: {
      colors: {
        neu: {
          base: '#e8edf5',
          dark: '#bec8d8',
          light: '#ffffff',
          text: '#1e293b',
          muted: '#64748b',
          accent: '#2563eb',
          'accent-hover': '#1d4ed8',
        },
        surface: '#e8edf5',
        page: '#e8edf5',
        brand: {
          DEFAULT: '#2563eb',
          hover: '#1d4ed8',
          light: '#dbeafe',
        },
        border: {
          DEFAULT: '#d1d9e6',
          focus: '#94a3b8',
        },
      },
      boxShadow: {
        'neu-flat': '8px 8px 18px #bec8d8, -8px -8px 18px #ffffff',
        'neu-flat-sm': '4px 4px 10px #bec8d8, -4px -4px 10px #ffffff',
        'neu-flat-lg': '12px 12px 28px #bec8d8, -12px -12px 28px #ffffff',
        'neu-pressed': 'inset 4px 4px 8px #bec8d8, inset -4px -4px 8px #ffffff',
        'neu-pressed-sm': 'inset 2px 2px 5px #bec8d8, inset -2px -2px 5px #ffffff',
        'neu-btn': '5px 5px 12px #bec8d8, -5px -5px 12px #ffffff',
        'neu-btn-pressed': 'inset 3px 3px 7px #bec8d8, inset -3px -3px 7px #ffffff',
      },
    },
  },
  plugins: [],
};
