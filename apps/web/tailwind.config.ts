import type { Config } from 'tailwindcss';

/**
 * Tailwind referencia las variables CSS de packages/design-tokens.
 * Ningún color queda hardcodeado suelto en una clase.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        surface: 'var(--color-surface)',
        'surface-variant': 'var(--color-surface-variant)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        border: 'var(--color-border)',
        'accent-blue': 'var(--color-accent-blue)',
        'block-blue-bg': 'var(--color-block-blue-bg)',
        'block-blue-on-bg': 'var(--color-block-blue-on-bg)',
        'block-purple-bg': 'var(--color-block-purple-bg)',
        'block-purple-on-bg': 'var(--color-block-purple-on-bg)',
        'block-coral-bg': 'var(--color-block-coral-bg)',
        'block-coral-on-bg': 'var(--color-block-coral-on-bg)',
        'block-green-bg': 'var(--color-block-green-bg)',
        'block-green-on-bg': 'var(--color-block-green-on-bg)',
        'block-amber-bg': 'var(--color-block-amber-bg)',
        'block-amber-on-bg': 'var(--color-block-amber-on-bg)',
        'block-teal-bg': 'var(--color-block-teal-bg)',
        'block-teal-on-bg': 'var(--color-block-teal-on-bg)',
      },
      fontFamily: {
        sans: 'var(--font-fallback)',
        primary: 'var(--font-primary), var(--font-fallback)',
        ui: 'var(--font-ui), var(--font-fallback)',
        mono: 'var(--font-mono), monospace',
      },
      fontSize: {
        xs: 'var(--font-size-xs)',
        sm: 'var(--font-size-sm)',
        base: 'var(--font-size-md)',
        lg: 'var(--font-size-lg)',
        xl: 'var(--font-size-xl)',
        '2xl': 'var(--font-size-2xl)',
        '3xl': 'var(--font-size-3xl)',
        '4xl': 'var(--font-size-4xl)',
      },
      fontWeight: {
        regular: 'var(--font-weight-regular)',
        medium: 'var(--font-weight-medium)',
        bold: 'var(--font-weight-bold)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      boxShadow: {
        e1: 'var(--elevation-e1)',
        e2: 'var(--elevation-e2)',
        e3: 'var(--elevation-e3)',
      },
      transitionDuration: {
        fast: 'var(--motion-duration-fast)',
        normal: 'var(--motion-duration-normal)',
        slow: 'var(--motion-duration-slow)',
      },
      transitionTimingFunction: {
        standard: 'var(--motion-easing-standard)',
        emphasized: 'var(--motion-easing-emphasized)',
      },
      screens: {
        mobile: '0px',
        tablet: '640px',
        desktop: '1024px',
      },
    },
  },
  plugins: [],
} satisfies Config;
