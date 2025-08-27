import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        chart: {
          "1": "var(--chart-1)",
          "2": "var(--chart-2)",
          "3": "var(--chart-3)",
          "4": "var(--chart-4)",
          "5": "var(--chart-5)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar-background)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
        // Custom billiards theme colors
        "felt-dark": "var(--felt-dark)",
        "felt-green": "var(--felt-green)",
        "neon-green": "var(--neon-green)",
        "dollar-green": "var(--dollar-green)",
        "pool-blue": "var(--pool-blue)",
        "warning-amber": "var(--warning-amber)",
        "danger-red": "var(--danger-red)",
      },
      fontFamily: {
        sans: "var(--font-sans)",
        serif: "var(--font-serif)",
        mono: "var(--font-mono)",
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
        "pulse-neon": {
          "0%, 100%": {
            opacity: "1",
            boxShadow: "0 0 10px rgba(0, 255, 65, 0.8)",
          },
          "50%": {
            opacity: "0.7",
            boxShadow: "0 0 20px rgba(0, 255, 65, 0.4)",
          },
        },
        shimmer: {
          "0%": {
            backgroundPosition: "-200px 0",
          },
          "100%": {
            backgroundPosition: "calc(200px + 100%) 0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-neon": "pulse-neon 2s ease-in-out infinite",
        shimmer: "shimmer 1.5s infinite",
      },
      backgroundImage: {
        "felt-texture": "radial-gradient(circle at 25% 25%, var(--felt-green) 0%, hsl(142, 69%, 15%) 50%, var(--felt-dark) 100%)",
        "neon-glow": "radial-gradient(circle, var(--neon-green) 0%, transparent 70%)",
        "smoky": "linear-gradient(135deg, hsla(0, 0%, 0%, 0.9) 0%, hsla(142, 69%, 20%, 0.3) 50%, hsla(0, 0%, 0%, 0.9) 100%)",
        "gradient-felt": "linear-gradient(180deg, hsl(0, 0%, 7%) 0%, hsl(0, 0%, 5%) 100%)",
        "gradient-neon": "linear-gradient(135deg, var(--neon-green) 0%, var(--secondary) 100%)",
      },
      boxShadow: {
        "neon": "0 0 20px rgba(0, 255, 65, 0.5)",
        "neon-lg": "0 0 40px rgba(0, 255, 65, 0.6)",
        "felt": "0 10px 30px rgba(0, 0, 0, 0.8)",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
