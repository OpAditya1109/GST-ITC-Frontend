/**
 * utils/theme.js — App-wide design tokens
 */

export const COLORS = {
  primary: '#1A6FE8',       // Blue — trust, finance
  primaryDark: '#1557C0',
  primaryLight: '#E8F0FD',

  success: '#16A34A',
  successLight: '#DCFCE7',

  warning: '#D97706',
  warningLight: '#FEF3C7',

  error: '#DC2626',
  errorLight: '#FEE2E2',

  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceAlt: '#F1F5F9',

  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',

  border: '#E2E8F0',
  borderLight: '#F1F5F9',

  // GST specific
  inputGST: '#16A34A',   // green — money coming IN (ITC)
  outputGST: '#DC2626',  // red — money going OUT
  payable: '#D97706',    // amber — net payable
};

export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const RADIUS = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 24,
  round: 999,
};

export const SHADOW = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
};
