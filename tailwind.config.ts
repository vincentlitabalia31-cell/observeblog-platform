import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1f1f1f',
        paper: '#f7f5ef',
        secondary: '#3a3a3a',
        soft: '#756f68',
        clay: '#9d6b53',
        sage: '#7d8a73'
      },
      boxShadow: {
        panel: '0 18px 50px rgba(15, 23, 42, 0.08)'
      }
    }
  },
  plugins: [require('@tailwindcss/typography')]
};

export default config;
