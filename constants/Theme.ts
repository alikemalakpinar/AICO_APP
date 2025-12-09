// Premium Modern Theme - Professional Design System
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

// Color Palette - Modern & Vibrant Design
export const COLORS = {
  // Primary Brand Colors - Premium Blue Gradient
  primary: {
    main: '#0F172A',      // Rich Dark Navy
    light: '#1E293B',
    dark: '#020617',
    accent: '#3B82F6',    // Vibrant Blue
    accentLight: '#60A5FA',
    accentDark: '#2563EB',
    gradient: ['#3B82F6', '#8B5CF6'], // Blue to Purple
  },

  // Secondary Accent Colors
  secondary: {
    purple: '#8B5CF6',
    pink: '#EC4899',
    cyan: '#06B6D4',
    orange: '#F97316',
    emerald: '#10B981',
  },

  // Neutral Grays - Sophisticated Scale
  neutral: {
    50: '#FAFAFA',
    100: '#F4F4F5',
    200: '#E4E4E7',
    300: '#D4D4D8',
    400: '#A1A1AA',
    500: '#71717A',
    600: '#52525B',
    700: '#3F3F46',
    800: '#27272A',
    900: '#18181B',
    950: '#09090B',
  },

  // Status Colors - Modern & Clean
  success: {
    main: '#10B981',
    light: '#34D399',
    lighter: '#6EE7B7',
    muted: '#D1FAE5',
    text: '#065F46',
    gradient: ['#10B981', '#059669'],
  },
  warning: {
    main: '#F59E0B',
    light: '#FBBF24',
    lighter: '#FCD34D',
    muted: '#FEF3C7',
    text: '#92400E',
    gradient: ['#F59E0B', '#D97706'],
  },
  error: {
    main: '#EF4444',
    light: '#F87171',
    lighter: '#FCA5A5',
    muted: '#FEE2E2',
    text: '#991B1B',
    gradient: ['#EF4444', '#DC2626'],
  },
  info: {
    main: '#3B82F6',
    light: '#60A5FA',
    lighter: '#93C5FD',
    muted: '#DBEAFE',
    text: '#1E40AF',
    gradient: ['#3B82F6', '#2563EB'],
  },

  // Light Theme
  light: {
    background: '#F8FAFC',
    backgroundSecondary: '#F1F5F9',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    surfaceSecondary: '#F1F5F9',
    surfaceGlass: 'rgba(255, 255, 255, 0.8)',
    border: '#E2E8F0',
    borderLight: '#F1F5F9',
    divider: '#E2E8F0',
    text: {
      primary: '#0F172A',
      secondary: '#475569',
      tertiary: '#94A3B8',
      disabled: '#CBD5E1',
      inverse: '#FFFFFF',
      accent: '#3B82F6',
    },
    icon: {
      primary: '#0F172A',
      secondary: '#64748B',
      tertiary: '#94A3B8',
    },
    overlay: 'rgba(15, 23, 42, 0.6)',
    overlayLight: 'rgba(15, 23, 42, 0.3)',
  },

  // Dark Theme
  dark: {
    background: '#0F172A',
    backgroundSecondary: '#1E293B',
    surface: '#1E293B',
    surfaceElevated: '#334155',
    surfaceSecondary: '#334155',
    surfaceGlass: 'rgba(30, 41, 59, 0.8)',
    border: '#334155',
    borderLight: '#475569',
    divider: '#334155',
    text: {
      primary: '#F8FAFC',
      secondary: '#CBD5E1',
      tertiary: '#94A3B8',
      disabled: '#64748B',
      inverse: '#0F172A',
      accent: '#60A5FA',
    },
    icon: {
      primary: '#F8FAFC',
      secondary: '#CBD5E1',
      tertiary: '#94A3B8',
    },
    overlay: 'rgba(0, 0, 0, 0.7)',
    overlayLight: 'rgba(0, 0, 0, 0.5)',
  },

  // Gradient Presets - Modern & Eye-catching
  gradients: {
    primary: ['#3B82F6', '#8B5CF6'],
    accent: ['#EC4899', '#F97316'],
    success: ['#10B981', '#059669'],
    warning: ['#F59E0B', '#D97706'],
    error: ['#EF4444', '#DC2626'],
    info: ['#3B82F6', '#0EA5E9'],
    purple: ['#8B5CF6', '#A855F7'],
    pink: ['#EC4899', '#F472B6'],
    cyan: ['#06B6D4', '#22D3EE'],
    dark: ['#1E293B', '#0F172A'],
    darkReverse: ['#0F172A', '#1E293B'],
    glass: ['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.75)'],
    glassBlue: ['rgba(59, 130, 246, 0.1)', 'rgba(139, 92, 246, 0.1)'],
    shimmer: ['#F1F5F9', '#E2E8F0', '#F1F5F9'],
    sunset: ['#F97316', '#EC4899'],
    ocean: ['#0EA5E9', '#6366F1'],
    forest: ['#10B981', '#06B6D4'],
    midnight: ['#1E293B', '#0F172A', '#020617'],
    premium: ['#3B82F6', '#8B5CF6', '#EC4899'],
  },

  // Semantic Colors
  semantic: {
    link: '#3B82F6',
    focus: '#3B82F6',
    selection: 'rgba(59, 130, 246, 0.15)',
    highlight: 'rgba(59, 130, 246, 0.1)',
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
