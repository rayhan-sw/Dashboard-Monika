import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // BPK Brand Colors
        'bpk-gold': '#FEB800',
        'bpk-orange': '#E27200',
        'bpk-orange-light': '#FE9A00',
        'bpk-dark-orange': '#BB4D00',
        
        // Status Colors
        'success': '#10B981',
        'error': '#EF4444',
        'warning': '#F59E0B',
        'info': '#3B82F6',
        
        // Grays
        'gray-1': '#8E8E93',
        'gray-2': '#AEAEB2',
        'gray-3': '#C7C7CC',
        'gray-4': '#D1D1D6',
        'gray-5': '#E5E5EA',
        'gray-6': '#F9FAFB',
        
        // Backgrounds
        'bg-yellow': '#FFFAEB',
        'bg-green': '#EBFDF5',
        'bg-blue': '#EEF6FF',
        'bg-red': '#FEF2F2',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
      },
      fontSize: {
        'overline': '10px',
        'caption': '12px',
        'body-2': '14px',
        'subtitle': '16px',
        'body-1': '18px',
        'h6': '20px',
        'h4': '28px',
        'h3': '32px',
      },
      borderRadius: {
        'sm-bpk': '7px',
        'md-bpk': '11px',
        'lg-bpk': '13px',
      },
      boxShadow: {
        'card': '0px 2px 4px rgba(0, 0, 0, 0.15)',
      },
      spacing: {
        'sidebar': '320px',
        'header': '80px',
      },
      backgroundImage: {
        'gradient-bpk': 'linear-gradient(163.18deg, #FEB800 3.75%, #E27200 100%)',
        'gradient-bpk-alt': 'linear-gradient(135.27deg, #FEB800 3.75%, #E27200 100%)',
      },
    },
  },
  plugins: [],
}
export default config
