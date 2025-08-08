module.exports = {
  content: [
    "./pages/*.{html,js}",
    "./index.html",
    "./js/*.js",
    "./components/*.html"
  ],
  theme: {
    extend: {
      colors: {
        // Primary Colors - Deep Indigo
        primary: {
          50: "#EEF2FF", // indigo-50
          100: "#E0E7FF", // indigo-100
          500: "#6366F1", // indigo-500
          600: "#4F46E5", // indigo-600
          700: "#4338CA", // indigo-700
          900: "#312E81", // indigo-900
          DEFAULT: "#4F46E5" // indigo-600
        },
        
        // Secondary Colors - Emerald Green
        secondary: {
          50: "#ECFDF5", // emerald-50
          100: "#D1FAE5", // emerald-100
          500: "#10B981", // emerald-500
          600: "#059669", // emerald-600
          700: "#047857", // emerald-700
          DEFAULT: "#10B981" // emerald-500
        },
        
        // Accent Colors - Warm Orange
        accent: {
          50: "#FFF7ED", // orange-50
          100: "#FFEDD5", // orange-100
          500: "#F97316", // orange-500
          600: "#EA580C", // orange-600
          DEFAULT: "#F97316" // orange-500
        },
        
        // Background Colors
        background: "#F7F9FB", // slate-50
        surface: "#FFFFFF", // white
        
        // Text Colors
        text: {
          primary: "#1F2937", // gray-800
          secondary: "#6B7280" // gray-500
        },
        
        // Status Colors
        success: "#059669", // emerald-600
        warning: "#D97706", // amber-600
        error: {
          light: "#EF4444", // red-500
          DEFAULT: "#DC2626" // red-600
        }
      },
      
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        inter: ['Inter', 'sans-serif']
      },
      
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }]
      },
      
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem'
      },
      
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px'
      },
      
      boxShadow: {
        'card': '0 2px 8px rgba(0, 0, 0, 0.05)',
        'interactive': '0 4px 12px rgba(79, 70, 229, 0.15)',
        'hover': '0 6px 16px rgba(79, 70, 229, 0.2)',
        'focus': '0 0 0 3px rgba(79, 70, 229, 0.1)'
      },
      
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 1.5s infinite',
        'bounce-gentle': 'bounceGentle 0.6s ease-in-out'
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' }
        }
      },
      
      transitionDuration: {
        '200': '200ms',
        '250': '250ms'
      },
      
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)'
      },
      
      backdropBlur: {
        xs: '2px'
      },
      
      maxWidth: {
        'chat': '80%',
        'mobile-chat': '90%'
      }
    }
  },
  plugins: [
    function({ addUtilities }) {
      const newUtilities = {
        '.text-gradient': {
          'background': 'linear-gradient(135deg, #4F46E5, #10B981)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-clip': 'text'
        },
        '.chat-bubble-user': {
          'background-color': '#4F46E5',
          'color': 'white',
          'padding': '12px 16px',
          'border-radius': '18px 18px 4px 18px',
          'margin-left': 'auto',
          'max-width': '80%'
        },
        '.chat-bubble-ai': {
          'background-color': '#FFFFFF',
          'color': '#1F2937',
          'padding': '12px 16px',
          'border-radius': '18px 18px 18px 4px',
          'border': '1px solid #E5E7EB',
          'max-width': '80%'
        }
      }
      addUtilities(newUtilities)
    }
  ]
}