// Premium Corporate Theme - Professional Design System
import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

// Screen dimensions
export const SCREEN = {
  width,
  height,
  isSmall: width < 375,
  isMedium: width >= 375 && width < 414,
  isLarge: width >= 414,
};

// Color Palette - Corporate & Professional
export const COLORS = {
  // Primary Brand Colors - Deep Burgundy/Maroon
  primary: {
    main: '#1A1A2E',        // Deep Navy
    light: '#2D2D44',
    dark: '#0F0F1A',
    accent: '#8B1538',      // Rich Burgundy
    accentLight: '#A52A4A',
    accentDark: '#6B1028',
    gradient: ['#8B1538', '#C41E3A'], // Burgundy gradient
  },

  // Secondary Accent Colors
  secondary: {
    gold: '#C9A227',        // Premium Gold
    bronze: '#B87333',
    silver: '#8A8A8A',
    teal: '#2E8B8B',
    emerald: '#2E7D32',
  },

  // Neutral Grays - Professional Scale
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
    950: '#121212',
  },

  // Status Colors - Clean & Professional
  success: {
    main: '#2E7D32',
    light: '#4CAF50',
    lighter: '#81C784',
    muted: '#E8F5E9',
    text: '#1B5E20',
    gradient: ['#2E7D32', '#1B5E20'],
  },
  warning: {
    main: '#F57C00',
    light: '#FF9800',
    lighter: '#FFB74D',
    muted: '#FFF3E0',
    text: '#E65100',
    gradient: ['#F57C00', '#E65100'],
  },
  error: {
    main: '#C62828',
    light: '#EF5350',
    lighter: '#EF9A9A',
    muted: '#FFEBEE',
    text: '#B71C1C',
    gradient: ['#C62828', '#B71C1C'],
  },
  info: {
    main: '#1565C0',
    light: '#42A5F5',
    lighter: '#90CAF9',
    muted: '#E3F2FD',
    text: '#0D47A1',
    gradient: ['#1565C0', '#0D47A1'],
  },

  // Light Theme
  light: {
    background: '#F8F9FA',
    backgroundSecondary: '#ECEFF1',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    surfaceSecondary: '#F5F5F5',
    surfaceGlass: 'rgba(255, 255, 255, 0.95)',
    border: '#E0E0E0',
    borderLight: '#EEEEEE',
    divider: '#E0E0E0',
    text: {
      primary: '#1A1A2E',
      secondary: '#5C5C6D',
      tertiary: '#9E9E9E',
      disabled: '#BDBDBD',
      inverse: '#FFFFFF',
      accent: '#8B1538',
    },
    icon: {
      primary: '#1A1A2E',
      secondary: '#757575',
      tertiary: '#9E9E9E',
    },
    overlay: 'rgba(26, 26, 46, 0.7)',
    overlayLight: 'rgba(26, 26, 46, 0.4)',
  },

  // Dark Theme
  dark: {
    background: '#1A1A2E',
    backgroundSecondary: '#2D2D44',
    surface: '#2D2D44',
    surfaceElevated: '#3D3D5C',
    surfaceSecondary: '#3D3D5C',
    surfaceGlass: 'rgba(45, 45, 68, 0.9)',
    border: '#3D3D5C',
    borderLight: '#4D4D6C',
    divider: '#3D3D5C',
    text: {
      primary: '#FAFAFA',
      secondary: '#BDBDBD',
      tertiary: '#9E9E9E',
      disabled: '#757575',
      inverse: '#1A1A2E',
      accent: '#E57373',
    },
    icon: {
      primary: '#FAFAFA',
      secondary: '#BDBDBD',
      tertiary: '#9E9E9E',
    },
    overlay: 'rgba(0, 0, 0, 0.8)',
    overlayLight: 'rgba(0, 0, 0, 0.6)',
  },

  // Gradient Presets - Corporate Style
  gradients: {
    primary: ['#8B1538', '#6B1028'],
    accent: ['#C9A227', '#B87333'],
    success: ['#2E7D32', '#1B5E20'],
    warning: ['#F57C00', '#E65100'],
    error: ['#C62828', '#B71C1C'],
    info: ['#1565C0', '#0D47A1'],
    gold: ['#C9A227', '#9C7B16'],
    burgundy: ['#8B1538', '#C41E3A'],
    teal: ['#2E8B8B', '#1F6E6E'],
    dark: ['#2D2D44', '#1A1A2E'],
    darkReverse: ['#1A1A2E', '#2D2D44'],
    glass: ['rgba(255,255,255,0.98)', 'rgba(255,255,255,0.90)'],
    corporate: ['#1A1A2E', '#8B1538'],
    premium: ['#8B1538', '#C9A227'],
  },

  // Semantic Colors
  semantic: {
    link: '#1565C0',
    focus: '#8B1538',
    selection: 'rgba(139, 21, 56, 0.15)',
    highlight: 'rgba(139, 21, 56, 0.1)',
  },
};

// Typography - Clean & Modern
export const TYPOGRAPHY = {
  fontFamily: {
    regular: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    medium: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    semiBold: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    bold: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
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
    '6xl': 48,
    display: 56,
  },
  lineHeight: {
    none: 1,
    tight: 1.15,
    snug: 1.3,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
    extraBold: '800' as const,
  },
  letterSpacing: {
    tighter: -0.8,
    tight: -0.4,
    normal: 0,
    wide: 0.4,
    wider: 0.8,
    widest: 1.6,
  },
};

// Spacing System - 4pt Grid
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
  '8xl': 96,
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
  '4xl': 28,
  full: 9999,
};

// Shadows - Modern & Layered
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
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  '2xl': {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 32,
    elevation: 12,
  },
  inner: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 0,
  },
  colored: (color: string, opacity: number = 0.3) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: opacity,
    shadowRadius: 16,
    elevation: 6,
  }),
  glow: (color: string, intensity: number = 0.4) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: intensity,
    shadowRadius: 20,
    elevation: 8,
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
    slowest: 600,
  },
  spring: {
    gentle: { tension: 40, friction: 7 },
    default: { tension: 50, friction: 8 },
    bouncy: { tension: 60, friction: 6 },
    stiff: { tension: 80, friction: 10 },
    snappy: { tension: 120, friction: 12 },
    responsive: { tension: 180, friction: 20, mass: 0.5 },
  },
  easing: {
    ease: [0.25, 0.1, 0.25, 1],
    easeIn: [0.42, 0, 1, 1],
    easeOut: [0, 0, 0.58, 1],
    easeInOut: [0.42, 0, 0.58, 1],
    bounce: [0.68, -0.55, 0.265, 1.55],
  },
  // Staggered animation delays
  stagger: {
    fast: 50,
    normal: 100,
    slow: 150,
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

// Order Status - Modern Style
export const ORDER_STATUS = {
  created: {
    key: 'Sipariş Oluşturuldu',
    label: 'Beklemede',
    color: COLORS.info.main,
    lightColor: COLORS.info.light,
    bgColor: COLORS.info.muted,
    textColor: COLORS.info.text,
    gradient: COLORS.info.gradient,
    icon: 'clock-outline',
  },
  transfer: {
    key: 'Transfer Aşamasında',
    label: 'Transferde',
    color: COLORS.warning.main,
    lightColor: COLORS.warning.light,
    bgColor: COLORS.warning.muted,
    textColor: COLORS.warning.text,
    gradient: COLORS.warning.gradient,
    icon: 'truck-outline',
  },
  delivered: {
    key: 'Teslim Edildi',
    label: 'Teslim Edildi',
    color: COLORS.success.main,
    lightColor: COLORS.success.light,
    bgColor: COLORS.success.muted,
    textColor: COLORS.success.text,
    gradient: COLORS.success.gradient,
    icon: 'check-circle-outline',
  },
  cancelled: {
    key: 'İptal Edildi',
    label: 'İptal',
    color: COLORS.error.main,
    lightColor: COLORS.error.light,
    bgColor: COLORS.error.muted,
    textColor: COLORS.error.text,
    gradient: COLORS.error.gradient,
    icon: 'close-circle-outline',
  },
};

// Component Styles - Modern Design
export const COMPONENTS = {
  // Card Styles
  card: {
    default: {
      backgroundColor: COLORS.light.surface,
      borderRadius: RADIUS['2xl'],
      padding: SPACING.base,
      borderWidth: 1,
      borderColor: COLORS.light.border,
    },
    elevated: {
      backgroundColor: COLORS.light.surface,
      borderRadius: RADIUS['2xl'],
      padding: SPACING.base,
      ...SHADOWS.lg,
    },
    glass: {
      backgroundColor: COLORS.light.surfaceGlass,
      borderRadius: RADIUS['2xl'],
      padding: SPACING.base,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.3)',
      ...SHADOWS.md,
    },
    outlined: {
      backgroundColor: 'transparent',
      borderRadius: RADIUS['2xl'],
      padding: SPACING.base,
      borderWidth: 1.5,
      borderColor: COLORS.light.border,
    },
    gradient: {
      borderRadius: RADIUS['2xl'],
      padding: SPACING.base,
      overflow: 'hidden' as const,
    },
  },

  // Button Styles
  button: {
    primary: {
      backgroundColor: COLORS.primary.accent,
      borderRadius: RADIUS.lg,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.lg,
      ...SHADOWS.colored(COLORS.primary.accent, 0.3),
    },
    secondary: {
      backgroundColor: COLORS.light.surfaceSecondary,
      borderRadius: RADIUS.lg,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.lg,
    },
    accent: {
      backgroundColor: COLORS.secondary.purple,
      borderRadius: RADIUS.lg,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.lg,
      ...SHADOWS.colored(COLORS.secondary.purple, 0.3),
    },
    ghost: {
      backgroundColor: 'transparent',
      borderRadius: RADIUS.lg,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.lg,
    },
    outline: {
      backgroundColor: 'transparent',
      borderRadius: RADIUS.lg,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.lg,
      borderWidth: 1.5,
      borderColor: COLORS.primary.accent,
    },
    gradient: {
      borderRadius: RADIUS.lg,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.lg,
      overflow: 'hidden' as const,
    },
  },

  // Input Styles
  input: {
    default: {
      backgroundColor: COLORS.light.surfaceSecondary,
      borderRadius: RADIUS.lg,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.base,
      borderWidth: 1.5,
      borderColor: COLORS.light.border,
      fontSize: TYPOGRAPHY.fontSize.base,
      color: COLORS.light.text.primary,
    },
    focused: {
      borderColor: COLORS.primary.accent,
      borderWidth: 2,
      backgroundColor: COLORS.light.surface,
    },
    error: {
      borderColor: COLORS.error.main,
      borderWidth: 2,
    },
    filled: {
      backgroundColor: COLORS.light.surfaceSecondary,
      borderRadius: RADIUS.lg,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.base,
      borderWidth: 0,
      fontSize: TYPOGRAPHY.fontSize.base,
      color: COLORS.light.text.primary,
    },
  },

  // Badge Styles
  badge: {
    default: {
      paddingHorizontal: SPACING.sm,
      paddingVertical: SPACING.xs,
      borderRadius: RADIUS.full,
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
    gradient: {
      paddingHorizontal: SPACING.sm,
      paddingVertical: SPACING.xs,
      borderRadius: RADIUS.full,
      overflow: 'hidden' as const,
    },
  },

  // Tab Styles
  tab: {
    default: {
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.base,
      borderRadius: RADIUS.full,
    },
    active: {
      backgroundColor: COLORS.primary.accent,
    },
    inactive: {
      backgroundColor: 'transparent',
    },
  },

  // List Item Styles
  listItem: {
    default: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.base,
      backgroundColor: COLORS.light.surface,
      borderRadius: RADIUS.xl,
    },
    bordered: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.base,
      backgroundColor: COLORS.light.surface,
      borderRadius: RADIUS.xl,
      borderWidth: 1,
      borderColor: COLORS.light.border,
    },
  },

  // Avatar Styles
  avatar: {
    xs: { width: 24, height: 24, borderRadius: 12 },
    sm: { width: 32, height: 32, borderRadius: 16 },
    md: { width: 40, height: 40, borderRadius: 20 },
    lg: { width: 48, height: 48, borderRadius: 24 },
    xl: { width: 64, height: 64, borderRadius: 32 },
    '2xl': { width: 80, height: 80, borderRadius: 40 },
  },

  // Icon Button
  iconButton: {
    sm: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    md: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    lg: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
  },
};

// Layout Constants
export const LAYOUT = {
  screenPadding: SPACING.base,
  screenPaddingLarge: SPACING.xl,
  cardGap: SPACING.md,
  sectionGap: SPACING.xl,
  headerHeight: 56,
  headerHeightLarge: 64,
  tabBarHeight: 70,
  bottomSafeArea: 34,
  maxContentWidth: 480,
};

// Glassmorphism Effects
export const GLASS = {
  light: {
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    backdropFilter: 'blur(20px)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  dark: {
    backgroundColor: 'rgba(30, 41, 59, 0.75)',
    backdropFilter: 'blur(20px)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  accent: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    backdropFilter: 'blur(20px)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
};

// Chart Colors
export const CHART_COLORS = [
  COLORS.primary.accent,
  COLORS.secondary.purple,
  COLORS.secondary.pink,
  COLORS.secondary.cyan,
  COLORS.secondary.orange,
  COLORS.secondary.emerald,
];

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
  GLASS,
  CHART_COLORS,
};
