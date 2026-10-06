/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#FBFBFA",
        surface: "#FFFFFF",
        charcoal: {
          900: "#111111",
          800: "#222222",
          700: "#333333",
          600: "#555555",
          400: "#787774",
          200: "#D1D1CF",
        },
        borderLight: "#EAEAEA",
        pastel: {
          green: {
            bg: "#EDF3EC",
            text: "#346538",
            border: "#D6E5D4",
          },
          red: {
            bg: "#FDEBEC",
            text: "#9F2F2D",
            border: "#F9D2D4",
          },
          yellow: {
            bg: "#FBF3DB",
            text: "#956400",
            border: "#F3E7BE",
          },
          blue: {
            bg: "#E1F3FE",
            text: "#1F6C9F",
            border: "#C7E6FD",
          },
        },
      },
      fontFamily: {
        sans: [
          '"Geist Sans"',
          '"SF Pro Display"',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        serif: [
          '"Newsreader"',
          '"Playfair Display"',
          'Georgia',
          'serif',
        ],
        mono: [
          '"Geist Mono"',
          '"JetBrains Mono"',
          '"SF Mono"',
          'monospace',
        ],
      },
      boxShadow: {
        subtle: "0 1px 3px rgba(0,0,0,0.02), 0 2px 8px rgba(0,0,0,0.04)",
      },
    },
  },
  plugins: [],
}
