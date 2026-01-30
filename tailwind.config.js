/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // PRIMARY BRAND COLORS - Clean Green (Emerald)
        primary: {
          50: '#ECFDF5',   // Very light mint - for backgrounds
          100: '#D1FAE5',  // Light mint - for hover states
          200: '#A7F3D0',  // Soft green
          300: '#6EE7B7',  // Light green
          400: '#34D399',  // Medium green
          500: '#10B981',  // ← YOUR MAIN BRAND COLOR (Emerald)
          600: '#059669',  // Darker - for button hover
          700: '#047857',  // Deep green
          800: '#065F46',  // Very deep
          900: '#064E3B',  // Darkest - for text on light bg
        },

        // SECONDARY COLORS - Teal (Complementary)
        secondary: {
          50: '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#14B8A6',  // ← Main Teal
          600: '#0D9488',
          700: '#0F766E',
          800: '#115E59',
          900: '#134E4A',
        },

        // SEMANTIC COLORS
        
        // Success - For correct answers, saved states, positive feedback
        success: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',   // ← Main success green
          600: '#16A34A',
          700: '#15803D',
          800: '#166534',
          900: '#14532D',
        },

        // Error/Danger - For wrong answers, delete actions, errors
        error: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#EF4444',   // ← Main error red
          600: '#DC2626',
          700: '#B91C1C',
          800: '#991B1B',
          900: '#7F1D1D',
        },

        // Warning - For review needed, caution states
        warning: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',   // ← Main warning amber
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },

        // Info - For tips, information, neutral notifications
        info: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',   // ← Main info blue
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },

        // NEUTRAL COLORS - Text, backgrounds, borders
        neutral: {
          50: '#FAFAFA',   // Almost white - page backgrounds
          100: '#F5F5F5',  // Light gray - card backgrounds
          200: '#E5E5E5',  // Border color
          300: '#D4D4D4',  // Disabled states
          400: '#A3A3A3',  // Placeholder text
          500: '#737373',  // Secondary text
          600: '#525252',  // Body text
          700: '#404040',  // 
          800: '#262626',  // Headings
          900: '#171717',  // Dark text, almost black
        },
      },

      // TYPOGRAPHY - Font families
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'Inter', 'sans-serif'], // For headings/titles
      },

      // FONT SIZES with proper line heights
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],      // 12px
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
        'base': ['1rem', { lineHeight: '1.5rem' }],     // 16px - body text
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
        '2xl': ['1.5rem', { lineHeight: '2rem' }],      // 24px - h3
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px - h2
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],   // 36px - h1
        '5xl': ['3rem', { lineHeight: '1' }],           // 48px - hero
        '6xl': ['3.75rem', { lineHeight: '1' }],        // 60px
      },

      // SPACING - Common spacing scale
      spacing: {
        '18': '4.5rem',   // 72px
        '112': '28rem',   // 448px
        '128': '32rem',   // 512px
      },

      // BORDER RADIUS - Consistent rounding
      borderRadius: {
        'sm': '0.25rem',   // 4px - small elements
        'DEFAULT': '0.5rem', // 8px - cards, buttons
        'md': '0.5rem',    // 8px
        'lg': '0.75rem',   // 12px - large cards
        'xl': '1rem',      // 16px - modals
        '2xl': '1.5rem',   // 24px
        '3xl': '2rem',     // 32px
      },

      // SHADOWS - Elevation system
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'DEFAULT': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        // Custom shadows with primary color
        'primary': '0 4px 14px 0 rgba(16, 185, 129, 0.25)',
        'primary-lg': '0 10px 40px 0 rgba(16, 185, 129, 0.3)',
      },

      // ANIMATIONS - Smooth transitions
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}