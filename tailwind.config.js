/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1A1611",
        paper: "#FFFFFF",
        sand: "#FAF7F2",
        ntk: {
          DEFAULT: "#E07A1F",
          dark: "#B8600F",
          light: "#F0A93A",
        },
        panel: "#2A251E",
        line: "#E4DFD5",
        muted: "#6E655A",
        ok: "#2F7D52",
        okbg: "#EAF4EE",
        warn: "#B8600F",
        warnbg: "#FCF0DF",
        bad: "#B23A2E",
        badbg: "#FBEAE7",
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
      },
      borderRadius: {
        sm: "4px",
      },
    },
  },
  plugins: [],
};
