/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [
    require('daisyui'),
  ],
  daisyui: {
    styled: true,
    base: true,
    themes: [
      {
        edu51: {
          'primary': '#2563eb',
          'primary-focus': '#1d4ed8',
          'primary-content': '#ffffff',

          'secondary': '#7c3aed',
          'secondary-focus': '#6d28d9',
          'secondary-content': '#ffffff',

          'accent': '#059669',
          'neutral': '#0f172a',
          'base-100': '#0b1220',
          'info': '#38bdf8',
          'success': '#10b981',
          'warning': '#f59e0b',
          'error': '#ef4444'
        }
      },
      // include the built-in themes used by the theme dropdown
      'default',
      'retro',
      'cyberpunk',
      'valentine',
      'aqua',
      'dark',
      'light'
    ],
  },
};
