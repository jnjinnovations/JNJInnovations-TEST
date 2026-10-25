/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'jnj-navy': '#0A1628',
        'jnj-silver': '#C0C0C0',
        'jnj-slate': '#45474c',
        'jnj-bg': '#fbf8fa',
      },
      fontFamily: {
        display: ['"Hanken Grotesk"', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      }
    },
  },
  plugins: [],
}

