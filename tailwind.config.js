import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let tailwindcssAnimate = () => ({});

try {
  tailwindcssAnimate = require('tailwindcss-animate');
} catch (_err) {
  // Allow builds in restricted/offline environments where dependency install is blocked.
}

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
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
        sidebar: "hsl(var(--sidebar))",
        "surface-hover": "hsl(var(--surface-hover))",
        // Git-specific colors
        git: {
          added: "hsl(var(--git-added))",
          removed: "hsl(var(--git-removed))",
          modified: "hsl(var(--git-modified))",
          renamed: "hsl(var(--git-renamed))",
          untracked: "hsl(var(--git-untracked))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        xs: '0 1px 2px 0 hsl(240 3% 8% / 0.06)',
        soft: '0 8px 20px -12px hsl(240 8% 8% / 0.24)',
        lifted: '0 20px 40px -22px hsl(240 8% 8% / 0.42)',
        glow: '0 0 0 1px hsl(var(--ring) / 0.25), 0 0 0 6px hsl(var(--ring) / 0.12)',
        inset: 'inset 0 1px 0 0 hsl(0 0% 100% / 0.28), inset 0 0 0 1px hsl(var(--border) / 0.7)',
      },
    },
  },
  plugins: [tailwindcssAnimate],
};
