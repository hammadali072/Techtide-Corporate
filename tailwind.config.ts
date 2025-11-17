import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        Lexend: 'Lexend',
        KumbhSans: 'KumbhSans',
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        textile: {
          cream: "hsl(var(--textile-cream))",
          linen: "hsl(var(--textile-linen))",
          cotton: "hsl(var(--textile-cotton))",
          silk: "hsl(var(--textile-silk))",
          denim: "hsl(var(--textile-denim))",
          charcoal: "hsl(var(--textile-charcoal))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      backgroundImage: {
        'gradient-hero': 'var(--gradient-hero)',
        'gradient-silk': 'var(--gradient-silk)',
        'gradient-denim': 'var(--gradient-denim)',
      },
      boxShadow: {
        'soft': 'var(--shadow-soft)',
        'elegant': 'var(--shadow-elegant)',
        'dramatic': 'var(--shadow-dramatic)',
      },
      transitionTimingFunction: {
        'gentle': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-in-up": {
          "0%": {
            opacity: "0",
            transform: "translateY(20px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "gentle-float": {
          "0%, 100%": {
            transform: "translateY(0px)",
          },
          "50%": {
            transform: "translateY(-10px)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.7s ease-out",
        "fade-in-up": "fade-in-up 0.7s cubic-bezier(0.4,0,0.2,1)",
        "gentle-float": "gentle-float 3s ease-in-out infinite",
      },
      transitionDelay: {
        '0': '0ms',
        '100': '100ms',
        '200': '200ms',
        '300': '300ms',
        '400': '400ms',
        '500': '500ms',
      },
      animationDelay: {
        '0': '0ms',
        '100': '100ms',
        '200': '200ms',
        '300': '300ms',
        '400': '400ms',
        '500': '500ms',
      },
    },
  },
  plugins: [
    plugin(function ({ addBase }) {
      addBase({
        body: {
          padding: "0",
          margin: "0",
          fontFamily: "KumbhSans",
        },
        html: {
          padding: "0",
          margin: "0",
        },
        "*": {
          boxSizing: "border-box",
        },
        li: {
          listStyle: "none",
          margin: "0",
          padding: "0",
        },
        ul: {
          listStyle: "none",
          margin: "0",
          padding: "0",
        },
        a: {
          display: "inline-block",
          textDecoration: "none",
          transition: ".5s",
          "&:hover": {
            textDecoration: "none",
          },
        },
        p: {
          margin: "0",
          padding: "0",
        },
        img: {
          maxWidth: "100%",
          display: "inline-block",
        },
        h1: {
          margin: "0",
          padding: "0",
          fontFamily: "Lexend",
        },
        h2: {
          margin: "0",
          padding: "0",
          fontFamily: "Lexend",
        },
        h3: {
          margin: "0",
          padding: "0",
          fontFmaily: "Lexend",
        },
        h4: {
          margin: "0",
          padding: "0",
        },
        h5: {
          margin: "0",
          padding: "0",
        },
        h6: {
          margin: "0",
          padding: "0",
        },
      });
    }),
  ],

} satisfies Config;
