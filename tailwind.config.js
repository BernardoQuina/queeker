module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  important: true,
  theme: {
    extend: {
      colors: {
        blue: {
          550: '#1DA1F2',
          650: '#188CD8',
          1000: '#1C2732',
          1100: '#15202b',
        },
      },
    },
  },
  variants: {
    textDecoration: ['hover'],
    underline: ['hover'],
    extend: {
      textDecoration: ['hover'],
      underline: ['hover'],
    },
  },
  plugins: [],
}
