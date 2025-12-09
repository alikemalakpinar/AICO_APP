// Premium Theme Configuration for Koyuncu Hali Tracking App
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

// Color Palette - Premium Dark & Light Themes
export const COLORS = {
  // Primary Brand Colors
  primary: {
    main: '#10B981', // Emerald Green
    light: '#34D399',
    dark: '#059669',
    gradient: ['#10B981', '#059669'],
  },

  // Secondary Accent
  secondary: {
    main: '#6366F1', // Indigo
    light: '#818CF8',
    dark: '#4F46E5',
  },

  // Status Colors
  success: {
    main: '#22C55E',
    light: '#86EFAC',
    dark: '#16A34A',
    bg: 'rgba(34, 197, 94, 0.1)',
  },
  warning: {
    main: '#F59E0B',
    light: '#FCD34D',
    dark: '#D97706',
    bg: 'rgba(245, 158, 11, 0.1)',
  },
  error: {
    main: '#EF4444',
    light: '#FCA5A5',
    dark: '#DC2626',
    bg: 'rgba(239, 68, 68, 0.1)',
  },
  info: {
    main: '#3B82F6',
    light: '#93C5FD',
    dark: '#2563EB',
    bg: 'rgba(59, 130, 246, 0.1)',
  },

  // Neutral Colors - Light Theme
  light: {
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceVariant: '#F1F5F9',
    border: '#E2E8F0',
    borderLight: '#F1F5F9',
    text: {
      primary: '#0F172A',
      secondary: '#475569',
      tertiary: '#94A3B8',
      inverse: '#FFFFFF',
    },
    overlay: 'rgba(15, 23, 42, 0.5)',
  },

  // Neutral Colors - Dark Theme
  dark: {
    background: '#0F172A',
    surface: '#1E293B',
    surfaceVariant: '#334155',
    border: '#475569',
    borderLight: '#334155',
    text: {
      primary: '#F8FAFC',
      secondary: '#CBD5E1',
      tertiary: '#64748B',
      inverse: '#0F172A',
    },
    overlay: 'rgba(0, 0, 0, 0.7)',
  },

  // Gradient Presets
  gradients: {
    primary: ['#10B981', '#059669'],
    primaryDark: ['#059669', '#047857'],
    secondary: ['#6366F1', '#4F46E5'],
    success: ['#22C55E', '#16A34A'],
    warning: ['#F59E0B', '#D97706'],
    error: ['#EF4444', '#DC2626'],
    info: ['#3B82F6', '#2563EB'],
    dark: ['#1E293B', '#0F172A'],
    glass: ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)'],
    cardLight: ['#FFFFFF', '#F8FAFC'],
    cardDark: ['#1E293B', '#0F172A'],
  },
};

// Typography
export const TYPOGRAPHY = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semiBold: 'System',
    bold: 'System',
  },
  fontSize: {
    xs: 10,
    sm: 12,
    md: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
    extraBold: '800' as const,
  },
};

// Spacing System
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
};

// Border Radius
export const RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
};

// Shadows
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
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  colored: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  }),
};

// Animation Configs
export const ANIMATIONS = {
  fast: 150,
  normal: 300,
  slow: 500,
  spring: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },
  bounce: {
    damping: 8,
    stiffness: 200,
    mass: 0.8,
  },
};

// Z-Index
export const Z_INDEX = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  overlay: 300,
  modal: 400,
  toast: 500,
  tooltip: 600,
};

// Order Status Colors
export const ORDER_STATUS = {
  created: {
    label: 'Siparis Olusturuldu',
    color: COLORS.info.main,
    bg: COLORS.info.bg,
    icon: 'clipboard-plus-outline',
  },
  transfer: {
    label: 'Transfer Asamasinda',
    color: COLORS.warning.main,
    bg: COLORS.warning.bg,
    icon: 'truck-delivery',
  },
  delivered: {
    label: 'Teslim Edildi',
    color: COLORS.success.main,
    bg: COLORS.success.bg,
    icon: 'check-circle',
  },
  cancelled: {
    label: 'Iptal Edildi',
    color: COLORS.error.main,
    bg: COLORS.error.bg,
    icon: 'close-circle',
  },
};

// Card Variants
export const CARD_VARIANTS = {
  default: {
    backgroundColor: COLORS.light.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    ...SHADOWS.md,
  },
  elevated: {
    backgroundColor: COLORS.light.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    ...SHADOWS.lg,
  },
  outlined: {
    backgroundColor: COLORS.light.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    borderWidth: 1,
    borderColor: COLORS.light.border,
  },
  glass: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
};

// Button Variants
export const BUTTON_VARIANTS = {
  primary: {
    backgroundColor: COLORS.primary.main,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  secondary: {
    backgroundColor: COLORS.secondary.main,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.primary.main,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
};

// Input Variants
export const INPUT_VARIANTS = {
  default: {
    backgroundColor: COLORS.light.surfaceVariant,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.base,
    borderWidth: 1,
    borderColor: COLORS.light.border,
    fontSize: TYPOGRAPHY.fontSize.base,
  },
  focused: {
    borderColor: COLORS.primary.main,
    borderWidth: 2,
  },
  error: {
    borderColor: COLORS.error.main,
    borderWidth: 2,
  },
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
  CARD_VARIANTS,
  BUTTON_VARIANTS,
  INPUT_VARIANTS,
  SCREEN,
};
