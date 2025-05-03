/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,jsx,ts,tsx}"
    ],
    theme: {
      extend: {},
    },
    plugins: [],
    safelist: [
      'text-red-500',
      'text-green-500',
      'text-blue-500',
      'text-yellow-500',
    ],
  }
  