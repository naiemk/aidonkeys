const COLORS = {
  black: "#000000",
  orange: "#fb8500",
  lightOrange: "#f48c06",
  yellow: "#ffb703",
  darkBlue: "#1d3557",
  midBlue: "#023047",
  lightBlue: "#219ebc",
  white: "#ffffff",
}

const theme = {
  // Background colors
  background: {
    primary: COLORS.orange,
    secondary: COLORS.lightOrange,
    tertiary: COLORS.yellow,
  },

  // Text colors
  text: {
    primary: COLORS.darkBlue,
    secondary: COLORS.midBlue,
    muted: COLORS.lightBlue,
  },

  // Accent colors
  accent: {
    primary: COLORS.white,
    secondary: COLORS.white,
  },

  // Border colors
  border: {
    default: COLORS.black,
    surround: COLORS.white,
    focus: COLORS.black,
  },

  // Button colors
  button: {
    background: COLORS.yellow,
    text: COLORS.white,
    hoverBackground: COLORS.lightOrange,
    border: COLORS.black,
  },

  // Card colors
  card: {
    background: COLORS.lightOrange,
    hoverBackground: COLORS.yellow,
  },

  // Input colors
  input: {
    background: COLORS.black,
    text: COLORS.white,
    placeholder: COLORS.yellow,
  },

  // Misc
  error: COLORS.white,
  success: COLORS.midBlue,
  warning: COLORS.white,
}

export default theme

