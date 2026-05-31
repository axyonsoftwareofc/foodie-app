// src/lib/constants/theme.constants.ts
export const COLORS = {
  primary: {
    50: '#E6F7F4',
    100: '#B3E8DE',
    500: '#00A082',
    600: '#008F74',
    700: '#007D66',
  },
  dark: {
    900: '#1A1A1A',
    800: '#2D2D2D',
    700: '#3D3D3D',
  },
  gray: {
    50: '#F6F6F6',
    100: '#E8E8E8',
    400: '#9B9B9B',
    500: '#6B6B6B',
  },
  feedback: {
    success: '#00A082',
    warning: '#FFAA00',
    error: '#FF4444',
  },
  rating: '#FACC15',
} as const;

export const SHADOWS = {
  sm: '0 1px 3px rgba(0, 0, 0, 0.1)',
  md: '0 4px 12px rgba(0, 0, 0, 0.15)',
  lg: '0 8px 24px rgba(0, 0, 0, 0.2)',
} as const;
