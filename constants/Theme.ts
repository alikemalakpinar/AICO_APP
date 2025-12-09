// Premium Minimal Theme - Professional Design System
import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Screen dimensions
export const SCREEN = {
  width,
  height,
  isSmall: width < 375,
  isMedium: width >= 375 && width < 414,
  isLarge: width >= 414,
};

// Color Palette - Sophisticated Neutral Design
export const COLORS = {
  // Primary Brand Color - Single Accent
  primary: {
    main: '#1A1A2E',      // Deep Navy
    light: '#2D2D44',
    dark: '#0F0F1A',
    accent: '#4A6CF7',    // Modern Blue Accent
    accentLight: '#6B8AFF',
    accentDark: '#3A5AD9',
  },

  // Neutral Grays - Sophisticated Scale
  neutral: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },

  // Status Colors - Muted & Professional
  success: {
    main: '#2E7D5A',
    light: '#4CAF7D',
    muted: '#E8F5EF',
    text: '#1B5E3E',
  },
  warning: {
    main: '#B8860B',
    light: '#DAA520',
    muted: '#FDF6E3',
    text: '#8B6914',
  },
  error: {
    main: '#C62828',
    light: '#EF5350',
    muted: '#FFEBEE',
    text: '#B71C1C',
  },
  info: {
    main: '#1565C0',
    light: '#42A5F5',
    muted: '#E3F2FD',
    text: '#0D47A1',
  },

  // Light Theme
  light: {
    background: '#FFFFFF',
    backgroundSecondary: '#FAFAFA',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    surfaceSecondary: '#F5F5F5',
    border: '#E8E8E8',
    borderLight: '#F0F0F0',
    divider: '#EEEEEE',
    text: {
      primary: '#1A1A1A',
      secondary: '#666666',
      tertiary: '#999999',
      disabled: '#BDBDBD',
      inverse: '#FFFFFF',
    },
    icon: {
      primary: '#1A1A1A',
      secondary: '#666666',
      tertiary: '#999999',
    },
    overlay: 'rgba(0, 0, 0, 0.5)',
    overlayLight: 'rgba(0, 0, 0, 0.3)',
  },

  // Dark Theme
  dark: {
    background: '#0A0A0F',
    backgroundSecondary: '#12121A',
    surface: '#1A1A24',
    surfaceElevated: '#22222E',
    surfaceSecondary: '#2A2A38',
    border: '#2E2E3A',
    borderLight: '#252530',
    divider: '#2A2A35',
    text: {
      primary: '#FAFAFA',
      secondary: '#B0B0B0',
      tertiary: '#707070',
      disabled: '#505050',
      inverse: '#1A1A1A',
    },
    icon: {
      primary: '#FAFAFA',
      secondary: '#B0B0B0',
      tertiary: '#707070',
    },
    overlay: 'rgba(0, 0, 0, 0.7)',
    overlayLight: 'rgba(0, 0, 0, 0.5)',
  },

  // Gradient Presets - Subtle & Professional
  gradients: {
    primary: ['#1A1A2E', '#2D2D44'],
    accent: ['#4A6CF7', '#3A5AD9'],
    subtle: ['#FAFAFA', '#F0F0F0'],
    dark: ['#1A1A24', '#0A0A0F'],
    glass: ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)'],
    shimmer: ['#F5F5F5', '#EEEEEE', '#F5F5F5'],
  },

  // Semantic Colors
  semantic: {
    link: '#4A6CF7',
    focus: '#4A6CF7',
    selection: 'rgba(74, 108, 247, 0.1)',
  },
};

// Typography - Clean & Modern
export const TYPOGRAPHY = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semiBold: 'System',
    bold: 'System',
  },
  fontSize: {
    '2xs': 10,
    xs: 11,
    sm: 13,
    md: 14,
    base: 15,
    lg: 17,
    xl: 19,
    '2xl': 22,
    '3xl': 26,
    '4xl': 32,
    '5xl': 40,
    display: 48,
  },
  lineHeight: {
    none: 1,
    tight: 1.2,
    snug: 1.35,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
  },
  letterSpacing: {
    tighter: -0.5,
    tight: -0.25,
    normal: 0,
    wide: 0.25,
    wider: 0.5,
    widest: 1,
  },
};

// Spacing System - 8pt Grid
export const SPACING = {
  '2xs': 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 56,
  '6xl': 64,
  '7xl': 80,
};

// Border Radius - Consistent Curves
export const RADIUS = {
  none: 0,
  xs: 4,
  sm: 6,
  md: 8,
  base: 10,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
};

// Shadows - Subtle & Layered
export const SHADOWS = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  inner: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 0,
  },
  colored: (color: string, opacity: number = 0.25) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: opacity,
    shadowRadius: 12,
    elevation: 4,
  }),
};

// Animation Configs
export const ANIMATIONS = {
  duration: {
    instant: 100,
    fast: 200,
    normal: 300,
    slow: 400,
    slower: 500,
  },
  spring: {
    gentle: { tension: 40, friction: 7 },
    default: { tension: 50, friction: 8 },
    bouncy: { tension: 60, friction: 6 },
    stiff: { tension: 80, friction: 10 },
  },
  easing: {
    ease: [0.25, 0.1, 0.25, 1],
    easeIn: [0.42, 0, 1, 1],
    easeOut: [0, 0, 0.58, 1],
    easeInOut: [0.42, 0, 0.58, 1],
  },
};

// Z-Index Scale
export const Z_INDEX = {
  hide: -1,
  base: 0,
  raised: 1,
  dropdown: 100,
  sticky: 200,
  overlay: 300,
  modal: 400,
  popover: 500,
  toast: 600,
  tooltip: 700,
  max: 9999,
};

// Order Status - Professional Style
export const ORDER_STATUS = {
  created: {
    key: 'Sipariş Oluşturuldu',
    label: 'Beklemede',
    color: COLORS.info.main,
    bgColor: COLORS.info.muted,
    textColor: COLORS.info.text,
    icon: 'clock-outline',
  },
  transfer: {
    key: 'Transfer Aşamasında',
    label: 'Transferde',
    color: COLORS.warning.main,
    bgColor: COLORS.warning.muted,
    textColor: COLORS.warning.text,
    icon: 'truck-outline',
  },
  delivered: {
    key: 'Teslim Edildi',
    label: 'Teslim Edildi',
    color: COLORS.success.main,
    bgColor: COLORS.success.muted,
    textColor: COLORS.success.text,
    icon: 'check-circle-outline',
  },
  cancelled: {
    key: 'İptal Edildi',
    label: 'Iptal',
    color: COLORS.error.main,
    bgColor: COLORS.error.muted,
    textColor: COLORS.error.text,
    icon: 'close-circle-outline',
  },
};

// Component Styles
export const COMPONENTS = {
  // Card Styles
  card: {
    default: {
      backgroundColor: COLORS.light.surface,
      borderRadius: RADIUS.xl,
      padding: SPACING.base,
      borderWidth: 1,
      borderColor: COLORS.light.border,
    },
    elevated: {
      backgroundColor: COLORS.light.surface,
      borderRadius: RADIUS.xl,
      padding: SPACING.base,
      ...SHADOWS.md,
    },
    outlined: {
      backgroundColor: 'transparent',
      borderRadius: RADIUS.xl,
      padding: SPACING.base,
      borderWidth: 1,
      borderColor: COLORS.light.border,
    },
  },

  // Button Styles
  button: {
    primary: {
      backgroundColor: COLORS.primary.main,
      borderRadius: RADIUS.base,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.lg,
    },
    secondary: {
      backgroundColor: COLORS.light.surfaceSecondary,
      borderRadius: RADIUS.base,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.lg,
    },
    accent: {
      backgroundColor: COLORS.primary.accent,
      borderRadius: RADIUS.base,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.lg,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderRadius: RADIUS.base,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.lg,
    },
  },

  // Input Styles
  input: {
    default: {
      backgroundColor: COLORS.light.surfaceSecondary,
      borderRadius: RADIUS.base,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.base,
      borderWidth: 1,
      borderColor: COLORS.light.border,
      fontSize: TYPOGRAPHY.fontSize.base,
      color: COLORS.light.text.primary,
    },
    focused: {
      borderColor: COLORS.primary.accent,
      borderWidth: 1.5,
    },
    error: {
      borderColor: COLORS.error.main,
      borderWidth: 1.5,
    },
  },

  // Badge Styles
  badge: {
    default: {
      paddingHorizontal: SPACING.sm,
      paddingVertical: SPACING.xs,
      borderRadius: RADIUS.sm,
      backgroundColor: COLORS.light.surfaceSecondary,
    },
    success: {
      backgroundColor: COLORS.success.muted,
    },
    warning: {
      backgroundColor: COLORS.warning.muted,
    },
    error: {
      backgroundColor: COLORS.error.muted,
    },
    info: {
      backgroundColor: COLORS.info.muted,
    },
  },
};

// Layout Constants
export const LAYOUT = {
  screenPadding: SPACING.base,
  cardGap: SPACING.md,
  sectionGap: SPACING.xl,
  headerHeight: 56,
  tabBarHeight: 64,
  bottomSafeArea: 34,
};

export default {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  RADIUS,
  SHADOWS,
  ANIMATIONS,
  Z_INDEX,
  ORDER_STATUS,
  COMPONENTS,
  LAYOUT,
  SCREEN,
};
