/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/index.css",
  ],
  theme: {
    fontFamily: {
      sans: ['Nanum Gothic', 'sans-serif'], // ✅ 기본 폰트 변경
    },
    extend: {},
  },
  plugins: [require('@tailwindcss/line-clamp')],
}
