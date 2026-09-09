/**
 * "Default" design language, light and dark variants.
 * Light: white paper, hairline borders, Mix UI type.
 * Dark: warm charcoal paper, the same type and a single Signal Blue accent.
 */

import '@/global.css';

import { Platform, StyleSheet } from 'react-native';

const Palette = {
  void: '#0B0C0E',
  graphite: '#131416',
  charcoal: '#1F1F21',
  smoke: '#3C3D3E',
  steel: '#71717A',
  fog: '#858687',
  ash: '#9D9E9F',
  chalk: '#CECECF',
  snow: '#FFFFFF',
  bone: '#F2F2F2',
  ink: '#333333',
  signalBlue: '#3B82F6',
  arcBlue: '#60A5FA',
  ringBlue: '#93C5FD',
  mint: '#4ADE80',
  fern: '#22C55E',
  coral: '#F87171',
  ember: '#EA580C',
  iris: '#314EF0',
} as const;

const LightColors = {
  text: '#131416',
  textSecondary: Palette.steel,
  textMuted: Palette.ash,
  background: '#FFFFFF',
  backgroundElement: '#FFFFFF',
  backgroundSelected: '#F4F4F5',
  softFill: 'rgba(15, 16, 18, 0.06)',
  accent: Palette.signalBlue,
  accentSoft: 'rgba(59, 130, 246, 0.1)',
  border: 'rgba(15, 16, 18, 0.08)',
  primary: Palette.signalBlue,
  onPrimary: Palette.snow,
  success: Palette.fern,
  danger: '#EF4444',
} as const;

const DarkColors = {
  text: Palette.bone,
  textSecondary: Palette.ash,
  textMuted: Palette.steel,
  background: '#161310',
  backgroundElement: '#1F1C18',
  backgroundSelected: '#2A2621',
  softFill: 'rgba(255, 255, 255, 0.06)',
  accent: Palette.arcBlue,
  accentSoft: 'rgba(96, 165, 250, 0.18)',
  border: 'rgba(255, 255, 255, 0.1)',
  primary: Palette.signalBlue,
  onPrimary: Palette.snow,
  success: Palette.mint,
  danger: Palette.coral,
} as const;

export const Colors = {
  light: LightColors,
  dark: DarkColors,
} as const;

export { Palette };

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = {
  sans: 'SpotifyMixUI-Regular',
  regular: 'SpotifyMixUI-Regular',
  medium: 'SpotifyMixUI-Bold',
  bold: 'SpotifyMixUI-TitleBold',
  display: 'SpotifyMixUI-TitleExtraBold',
  mono: 'SpotifyMixUI-Regular',
} as const;

/** Tight, engineered letter-spacing that eases as sizes grow. */
export const Tracking = {
  body: -0.1,
  subheading: -0.2,
  heading: -0.3,
  display: -0.4,
} as const;

export const Spacing = {
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

export const Radius = {
  small: 10,
  medium: 14,
  large: 20,
  pill: 999,
} as const;

/**
 * Elevation comes from hairline rings + a faint inset top highlight,
 * not cast shadows.
 */
export const HairlineBorder = {
  borderWidth: StyleSheet.hairlineWidth,
  borderColor: 'rgba(0, 0, 0, 0.08)',
} as const;

export const SoftShadow = {
  ...HairlineBorder,
  boxShadow: '0 1px 4px rgba(0, 0, 0, 0.05)',
} as const;

/** Shadow for the bone primary action pill. */
export const PrimaryActionShadow = {
  boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1), 0 0 1px rgba(0, 0, 0, 0.1)',
} as const;
