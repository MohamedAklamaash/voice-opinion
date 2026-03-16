/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink:      "#0a0a0a",
        "ink-2":  "#141414",
        "ink-3":  "#1e1e1e",
        "ink-4":  "#2a2a2a",
        "ink-5":  "#3a3a3a",
        ash:      "#888888",
        paper:    "#f0ebe3",
        gold:     "#e8b84b",
        "gold-dim":"#a07c28",
        signal:   "#3ddc84",
        danger:   "#e84040",
        // legacy aliases so existing code doesn't break
        "primary-black-700":   "#0a0a0a",
        "secondary-black-600": "#1e1e1e",
        "primary-white":       "#f0ebe3",
        "secondary-white":     "#888888",
        "primary-indigo":      "#e8b84b",
        "primary-success":     "#3ddc84",
        "primary-Darkred":     "#e84040",
        "primary-black-400":   "#2a2a2a",
        "gradient-violet":     "#e8b84b",
        "dialog-bg":           "rgba(0,0,0,0.75)",
      },
      fontFamily: {
        bebas:    ["Bebas Neue", "sans-serif"],
        fraunces: ["Fraunces", "serif"],
        mono:     ["DM Mono", "monospace"],
        // legacy
        montserrat: ["Bebas Neue", "sans-serif"],
        poppins:    ["DM Mono", "monospace"],
        roboto:     ["Fraunces", "serif"],
      },
      letterSpacing: {
        widest2: "0.25em",
      },
    },
  },
  plugins: [],
};
