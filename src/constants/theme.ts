import { Platform, useColorScheme } from 'react-native';

/**
 * Design Tokens matching DESIGN.md (Oli Vario 150)
 * Liquid Glass styling with automatic Dark & Light modes.
 */
export const Colors = {
  dark: {
    bg: '#0d0f14',
    bgGlow1: 'rgba(120, 140, 175, 0.30)',
    bgGlow2: 'rgba(120, 140, 175, 0.22)',
    text: '#ffffff',
    textMuted: 'rgba(255, 255, 255, 0.72)',
    textSubtle: 'rgba(255, 255, 255, 0.45)',

    // Legacy template compatibility
    background: '#0d0f14',
    backgroundElement: '#181b22',
    backgroundSelected: '#252932',
    textSecondary: 'rgba(255, 255, 255, 0.72)',

    // Liquid Glass
    glassFill: 'rgba(255, 255, 255, 0.07)',
    glassFillSubtle: 'rgba(255, 255, 255, 0.04)',
    glassBorder: 'rgba(255, 255, 255, 0.13)',
    glassHighlight: 'rgba(255, 255, 255, 0.26)',
    glassShadow: 'rgba(0, 0, 0, 0.35)',
    modalGlassFill: 'rgba(22, 26, 35, 0.88)',

    separator: 'rgba(255, 255, 255, 0.16)',
    ringTrack: 'rgba(255, 255, 255, 0.12)',

    // Primary Accent (Aman)
    accent: '#8fe3cb',
    accentText: '#a8ecd8',
    accentFill: 'rgba(143, 227, 203, 0.12)',
    accentBorder: 'rgba(143, 227, 203, 0.35)',

    // Status: Mendekati (10-30%)
    statusMendekati: '#f2c879',
    statusMendekatiText: '#f6d59b',
    statusMendekatiFill: 'rgba(242, 200, 121, 0.12)',
    statusMendekatiBorder: 'rgba(242, 200, 121, 0.35)',

    // Status: Segera ganti (<10% or overdue)
    statusSegeraGanti: '#ff8f8a',
    statusSegeraGantiText: '#ffa39e',
    statusSegeraGantiFill: 'rgba(255, 143, 138, 0.12)',
    statusSegeraGantiBorder: 'rgba(255, 143, 138, 0.35)',

    // Controls
    buttonFill: 'rgba(255, 255, 255, 0.92)',
    onButton: '#0d0f14',
    chipSelected: '#ffffff',
    chipSelectedText: '#0d0f14',
    tabActive: 'rgba(255, 255, 255, 0.13)',

    // Input fields
    inputBg: 'rgba(255, 255, 255, 0.05)',
    inputBorder: 'rgba(255, 255, 255, 0.15)',
  },
  light: {
    bg: '#eef0f4',
    bgGlow1: 'rgba(120, 140, 175, 0.35)',
    bgGlow2: 'rgba(120, 140, 175, 0.25)',
    text: '#0d0f14',
    textMuted: 'rgba(13, 15, 20, 0.60)',
    textSubtle: 'rgba(13, 15, 20, 0.40)',

    // Legacy template compatibility
    background: '#eef0f4',
    backgroundElement: '#e4e7ed',
    backgroundSelected: '#d8dce4',
    textSecondary: 'rgba(13, 15, 20, 0.60)',

    // Liquid Glass
    glassFill: 'rgba(255, 255, 255, 0.55)',
    glassFillSubtle: 'rgba(255, 255, 255, 0.35)',
    glassBorder: 'rgba(255, 255, 255, 0.70)',
    glassHighlight: 'rgba(255, 255, 255, 0.90)',
    glassShadow: 'rgba(20, 30, 50, 0.10)',
    modalGlassFill: 'rgba(255, 255, 255, 0.92)',

    separator: 'rgba(13, 15, 20, 0.10)',
    ringTrack: 'rgba(13, 15, 20, 0.10)',

    // Primary Accent (Aman)
    accent: '#2fa88c',
    accentText: '#14705d',
    accentFill: 'rgba(47, 168, 140, 0.14)',
    accentBorder: 'rgba(47, 168, 140, 0.40)',

    // Status: Mendekati (10-30%)
    statusMendekati: '#b7791f',
    statusMendekatiText: '#8c5b14',
    statusMendekatiFill: 'rgba(183, 121, 31, 0.14)',
    statusMendekatiBorder: 'rgba(183, 121, 31, 0.40)',

    // Status: Segera ganti (<10% or overdue)
    statusSegeraGanti: '#d64545',
    statusSegeraGantiText: '#a62828',
    statusSegeraGantiFill: 'rgba(214, 69, 69, 0.14)',
    statusSegeraGantiBorder: 'rgba(214, 69, 69, 0.40)',

    // Controls
    buttonFill: 'rgba(13, 15, 20, 0.92)',
    onButton: '#ffffff',
    chipSelected: '#0d0f14',
    chipSelectedText: '#ffffff',
    tabActive: 'rgba(13, 15, 20, 0.07)',

    // Input fields
    inputBg: 'rgba(255, 255, 255, 0.60)',
    inputBorder: 'rgba(13, 15, 20, 0.12)',
  },
} as const;

export type ThemeType = 'dark' | 'light';
export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Radius = {
  heroCard: 34,
  card: 30,
  statTile: 24,
  tabBar: 34,
  tabBarActive: 26,
  button: 28,
  chip: 22,
  modal: 32,
  sm: 10,
} as const;

export const Spacing = {
  horizontal: 20,
  cardGap: 12,
  topHeader: 64,
  tabBarHeight: 68,
  tabBarBottom: 24,
  touchTargetMin: 44,

  // Legacy spacing tokens for backwards compatibility
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

export const Fonts = Platform.select({
  ios: {
    sans: 'System',
    mono: 'Courier',
  },
  default: {
    sans: 'sans-serif',
    mono: 'monospace',
  },
});

/**
 * Hook to access current theme tokens automatically based on system appearance.
 */
export function useAppTheme() {
  const scheme = useColorScheme();
  const isDark = scheme !== 'light';
  const tokens = isDark ? Colors.dark : Colors.light;

  return {
    isDark,
    tokens,
    scheme: isDark ? ('dark' as const) : ('light' as const),
  };
}
