/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'DM Sans'", "system-ui", "sans-serif"],
      },
      animation: {
        "slide-up":    "slideUp 0.28s cubic-bezier(0.34,1.56,0.64,1) both",
        "slide-down":  "slideDown 0.22s ease-in both",
        "fade-in":     "fadeIn 0.18s ease both",
        "pop":         "pop 0.25s cubic-bezier(0.34,1.56,0.64,1) both",
        "confetti":    "confettiFall 1.2s ease-in forwards",
        "fire":        "fire 0.6s ease-in-out infinite alternate",
        "shimmer":     "shimmer 1.8s linear infinite",
        "pulse-ring":  "pulseRing 1.5s ease-out infinite",
        "bounce-in":   "bounceIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both",
      },
      keyframes: {
        slideUp:    { from: { opacity: 0, transform: "translateY(24px)" }, to: { opacity: 1, transform: "translateY(0)" } },
        slideDown:  { from: { opacity: 1, transform: "translateY(0)"    }, to: { opacity: 0, transform: "translateY(12px)" } },
        fadeIn:     { from: { opacity: 0 }, to: { opacity: 1 } },
        pop:        { from: { opacity: 0, transform: "scale(0.85)" }, to: { opacity: 1, transform: "scale(1)" } },
        fire:       { from: { transform: "scaleY(1) rotate(-2deg)" }, to: { transform: "scaleY(1.1) rotate(2deg)" } },
        shimmer:    { from: { backgroundPosition: "-200% 0" }, to: { backgroundPosition: "200% 0" } },
        pulseRing:  { "0%": { transform: "scale(1)", opacity: 0.6 }, "100%": { transform: "scale(1.6)", opacity: 0 } },
        bounceIn:   { "0%": { opacity: 0, transform: "scale(0.3)" }, "60%": { transform: "scale(1.08)" }, "100%": { opacity: 1, transform: "scale(1)" } },
      },
    },
  },
  plugins: [],
};
