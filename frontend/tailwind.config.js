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
        surface: '#fafaf8',
        page: '#f1f0ec',
        brand: {
          DEFAULT: '#0c3b5e',
          hover: '#0e4d7a',
          light: '#e3edf5',
        },
        border: {
          DEFAULT: '#dddcd8',
          focus: '#8a8a86',
        },
      },
    },
  },
  plugins: [],
};
