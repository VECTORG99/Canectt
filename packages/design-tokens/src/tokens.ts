/**
 * Tokens de diseño de Canectt.
 * Fuente única de verdad: este archivo. El script `build.ts` genera
 * `tokens.css` (variables CSS) y `tokens.json` (consumible por JS/configs).
 *
 * Principios (ver AGENTS.md / docs/CONVENTIONS.md):
 * - Ningún color hex suelto en componentes; siempre `var(--color-*)`.
 * - El degradado de marca se reserva como acento puntual (logo, botón principal),
 *   nunca como fondo dominante.
 * - Identidad visual Google/Gemini: superficies neutras, Material 3, sombras suaves.
 */

export type ThemeName = 'light' | 'dark';

export interface ColorTokens {
  surface: string;
  surfaceVariant: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  accentBlue: string;
  brandGradient: string;
  /** Stops individuales del degradado de marca (para SVG, etc.). */
  brandStopStart: string;
  brandStopMid: string;
  brandStopEnd: string;
}

export interface BlockColorTokens {
  /** Cada entrada es un par (fondo / texto-on-fondo) para bloques del editor. */
  [token: string]: { bg: string; onBg: string };
}

export interface ShapeTokens {
  /** Radios en px (escala Material 3). */
  radiusSm: number;
  radiusMd: number;
  radiusLg: number;
  radiusXl: number;
}

export interface ElevationTokens {
  /** Sombras suaves (blur alto, opacidad baja). */
  e1: string;
  e2: string;
  e3: string;
}

export interface TypographyTokens {
  primaryTypeface: string;
  uiTypeface: string;
  monoTypeface: string;
  fallbackStack: string;
  /** Escala modular (px). */
  scale: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    '2xl': number;
    '3xl': number;
    '4xl': number;
  };
  weights: {
    regular: number;
    medium: number;
    bold: number;
  };
}

export interface MotionTokens {
  durationFastMs: number;
  durationNormalMs: number;
  durationSlowMs: number;
  easingStandard: string;
  easingEmphasized: string;
  /** Respetar prefers-reduced-motion se aplica en CSS, no aquí. */
}

export interface DesignTokens {
  color: Record<ThemeName, ColorTokens>;
  blockColor: Record<ThemeName, BlockColorTokens>;
  shape: ShapeTokens;
  elevation: Record<ThemeName, ElevationTokens>;
  typography: TypographyTokens;
  motion: MotionTokens;
}

export const tokens: DesignTokens = {
  color: {
    light: {
      surface: '#FFFFFF',
      surfaceVariant: '#F8F9FA',
      textPrimary: '#1F1F1F',
      textSecondary: '#5F6368',
      border: '#E0E0E0',
      accentBlue: '#4285F4',
      brandGradient: 'linear-gradient(120deg, #4285F4 0%, #9B72CB 50%, #F28B82 100%)',
      brandStopStart: '#4285F4',
      brandStopMid: '#9B72CB',
      brandStopEnd: '#F28B82',
    },
    dark: {
      surface: '#131314',
      surfaceVariant: '#1E1F20',
      textPrimary: '#E8EAED',
      textSecondary: '#9AA0A6',
      border: '#3C4043',
      accentBlue: '#8AB4F8',
      brandGradient: 'linear-gradient(120deg, #8AB4F8 0%, #C58AF9 50%, #F6AEA9 100%)',
      brandStopStart: '#8AB4F8',
      brandStopMid: '#C58AF9',
      brandStopEnd: '#F6AEA9',
    },
  },
  blockColor: {
    light: {
      'block-blue': { bg: '#D2E3FC', onBg: '#1A3A6C' },
      'block-purple': { bg: '#E6D2F5', onBg: '#4A2A6B' },
      'block-coral': { bg: '#FCE8E6', onBg: '#7A2A2A' },
      'block-green': { bg: '#D7F0D7', onBg: '#1F5A1F' },
      'block-amber': { bg: '#FCE8B2', onBg: '#6B4A12' },
      'block-teal': { bg: '#CDEFEF', onBg: '#1F5A5A' },
    },
    dark: {
      'block-blue': { bg: '#2A3B5C', onBg: '#D2E3FC' },
      'block-purple': { bg: '#3D2A52', onBg: '#E6D2F5' },
      'block-coral': { bg: '#5C2A2A', onBg: '#FCE8E6' },
      'block-green': { bg: '#1F3D2A', onBg: '#D7F0D7' },
      'block-amber': { bg: '#5C4A12', onBg: '#FCE8B2' },
      'block-teal': { bg: '#1F4A4A', onBg: '#CDEFEF' },
    },
  },
  shape: {
    radiusSm: 4,
    radiusMd: 12,
    radiusLg: 20,
    radiusXl: 28,
  },
  elevation: {
    light: {
      e1: '0 1px 3px rgba(0,0,0,0.08)',
      e2: '0 2px 6px rgba(0,0,0,0.10)',
      e3: '0 4px 12px rgba(0,0,0,0.12)',
    },
    dark: {
      e1: '0 1px 3px rgba(0,0,0,0.40)',
      e2: '0 2px 6px rgba(0,0,0,0.45)',
      e3: '0 4px 12px rgba(0,0,0,0.50)',
    },
  },
  typography: {
    primaryTypeface: "'Google Sans'",
    uiTypeface: "'Google Sans Text'",
    monoTypeface: "'Google Sans Code'",
    fallbackStack:
      "'Google Sans', 'Google Sans Text', Roboto, -apple-system, 'Segoe UI', sans-serif",
    scale: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 24,
      '2xl': 32,
      '3xl': 44,
      '4xl': 56,
    },
    weights: {
      regular: 400,
      medium: 500,
      bold: 700,
    },
  },
  motion: {
    durationFastMs: 150,
    durationNormalMs: 250,
    durationSlowMs: 600,
    easingStandard: 'cubic-bezier(0.2, 0, 0, 1)',
    easingEmphasized: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
};
