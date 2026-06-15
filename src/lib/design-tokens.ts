/**
 * TrakkLess design tokens — mirrors CSS variables in index.css.
 * @see https://www.figma.com/design/U2kAiy0etZykhKZnU1AEhX/
 */
export const trakklessColors = {
  blue: {
    50: "#EFF8FF",
    100: "#DBEEFE",
    200: "#BFE0FE",
    300: "#93CCFD",
    400: "#3B9EFF",
    500: "#0085FF",
    600: "#0070D6",
    700: "#005BB3",
    800: "#004A94",
    900: "#003D7A",
  },
  purple: {
    50: "#F5F0FF",
    100: "#EDE5FF",
    200: "#DDD0FF",
    300: "#C4ADFC",
    400: "#B794F6",
    500: "#9568F5",
    600: "#794CEC",
    700: "#6D3FD4",
    800: "#5B2FB8",
    900: "#4A2596",
  },
  violet: {
    400: "#9B87F5",
    500: "#7B61FF",
    600: "#6B4FE6",
  },
  neutral: {
    0: "#FFFFFF",
    50: "#F9FAFB",
    100: "#F0F0F0",
    200: "#E5E5E5",
    300: "#D4D4D4",
    400: "#A3A3A3",
    500: "#7C7C7C",
    600: "#525252",
    700: "#404040",
    800: "#262626",
    900: "#171717",
    950: "#0B1120",
  },
  navy: {
    600: "#0A2A66",
    700: "#082151",
    800: "#0F1D3D",
  },
} as const;

export const trakklessTheme = {
  light: {
    background: trakklessColors.neutral[50],
    foreground: "#000000",
    mutedForeground: "#000000A6",
    card: trakklessColors.neutral[100],
    popover: trakklessColors.neutral[0],
    primary: trakklessColors.blue[500],
    brandPurple: trakklessColors.violet[500],
    brandBlue: trakklessColors.blue[500],
    border: "color-mix(in srgb, #7C7C7C 32%, transparent)",
    gradients: {
      navActive: "linear-gradient(135deg, #7B61FF 0%, #0085FF 100%)",
      sidebar: "linear-gradient(180deg, #FFFFFF 0%, #F0F0F0 70%, #F9FAFB 100%)",
      main: "linear-gradient(160deg, #F9FAFB 0%, #FFFFFF 30%, #EEF2FF 100%)",
    },
  },
  dark: {
    background: trakklessColors.neutral[950],
    foreground: "#FFFFFF",
    mutedForeground: "#FFFFFFA3",
    card: trakklessColors.navy[700],
    primary: trakklessColors.purple[600],
    brandPurple: trakklessColors.purple[600],
    brandBlue: trakklessColors.purple[500],
    border: "color-mix(in srgb, #7C7C7C 28%, transparent)",
    gradients: {
      sidebar: "linear-gradient(180deg, #794CEC66 0%, #082151 22%, #0B1120 100%)",
      main: "linear-gradient(152deg, #050A14 0%, #0B1120 18%, #082151 72%, #9568F5 100%)",
      navActive: "linear-gradient(135deg, #794CEC 0%, #9568F5 100%)",
    },
  },
} as const;

export const trakklessTypography = {
  fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif',
  display: { size: "2.25rem", lineHeight: "2.5rem", weight: 700 },
  h1: { size: "1.5rem", lineHeight: "2rem", weight: 700 },
  h2: { size: "1.25rem", lineHeight: "1.75rem", weight: 700 },
  h3: { size: "1.125rem", lineHeight: "1.625rem", weight: 600 },
  h4: { size: "1rem", lineHeight: "1.5rem", weight: 600 },
  bodyLg: { size: "1rem", lineHeight: "1.5rem", weight: 400 },
  body: { size: "0.875rem", lineHeight: "1.375rem", weight: 400 },
  caption: { size: "0.75rem", lineHeight: "1rem", weight: 400 },
  label: { size: "0.75rem", lineHeight: "1rem", weight: 600, letterSpacing: "0.06em" },
  button: { size: "0.875rem", lineHeight: "1.25rem", weight: 600 },
  nav: { size: "0.875rem", lineHeight: "1.375rem", weight: 500 },
} as const;

export const trakklessRadius = {
  sm: "0.5rem",    /* 8px  — badges, small chips */
  md: "0.625rem",  /* 10px */
  lg: "0.75rem",   /* 12px — buttons, inputs, nav */
  xl: "1rem",      /* 16px — cards */
  "2xl": "1.25rem",
  full: "9999px",
} as const;

export const trakklessSpacing = {
  page: "2rem",
  section: "1.5rem",
  card: "1.5rem",
  inputX: "1rem",
  navX: "0.75rem",
  navY: "0.625rem",
} as const;
