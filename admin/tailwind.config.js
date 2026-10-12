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
        serif: ['"Lora"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"DM Sans"', 'monospace'],
      },
      colors: {
        emerald: {
          DEFAULT: '#077432', // Lighter Emerald
          deep: '#077432',
          light: '#0A8D3E',  // Emerald Hover
          hover: '#0A8D3E',
          50: '#F0F9F4',
          100: '#E8F6ED',
          200: '#D4EDDC',
          300: '#A3DAB7',
          400: '#0A8D3E',
          500: '#077432',
          600: '#06632B',
          700: '#055224',
          800: '#04421D',
          900: '#033116',
          950: '#02210E',
        },
        ivory: {
          DEFAULT: '#F8F5ED', // Warm Ivory
          50: '#FDFCF9',
          100: '#F8F5ED',
          200: '#EEE8D8',
          300: '#E3DBC3',
          400: '#D5CAAC',
        },
        sage: {
          DEFAULT: '#DDE8E1', // Muted Sage
          50: '#F7FAF8',
          100: '#EEF3F0',
          200: '#DDE8E1',
          300: '#C5D6CC',
          400: '#A8C0B2',
          500: '#7E9F8B',
        },
        gold: {
          DEFAULT: '#C6A15B', // Soft Gold
          50: '#FAF6ED',
          100: '#F4EBD7',
          200: '#E9D6AF',
          300: '#DEC087',
          400: '#D2AB5F',
          500: '#C6A15B',
          600: '#AE8B47',
          700: '#8A6D37',
          800: '#675128',
          900: '#45361A',
        },
        charcoal: {
          DEFAULT: '#202522', // Charcoal Main Text
          50: '#F6F7F6',
          100: '#EBEDEB',
          200: '#D7DAD7',
          300: '#B6BBB5',
          400: '#8E948D',
          500: '#6B716A',
          600: '#525751',
          700: '#3D423C',
          800: '#2C302B',
          900: '#202522',
          950: '#141715',
        },
        brand: {
          50: '#F0F9F4',
          100: '#E8F6ED',
          200: '#D4EDDC',
          300: '#C6A15B',
          400: '#0A8D3E',
          500: '#077432', // Lighter Emerald
          600: '#0A8D3E', // Emerald Hover
          700: '#06632B',
          800: '#077432',
          900: '#055224',
          950: '#02210E',
        },
        ink: {
          50: '#F8F5ED',
          100: '#DDE8E1',
          200: '#D7DAD7',
          300: '#B6BBB5',
          400: '#8E948D',
          500: '#6B716A',
          600: '#525751',
          700: '#3D423C',
          800: '#2C302B',
          900: '#202522',
          950: '#141715',
        }
      }
    },
  },
  plugins: [],
}
