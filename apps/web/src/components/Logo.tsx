import { useNavigate } from 'react-router-dom';
import { dictionary } from '../i18n/index';

/** Logo SVG de Canectt (arco incompleto + punto). Usa el degradado de marca. */
export function Logo({ size = 32 }: { size?: number }) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate('/')}
      aria-label={dictionary.app.name}
      className="rounded-sm focus-visible:outline-none"
    >
      <svg
        viewBox="0 0 48 48"
        width={size}
        height={size}
        role="img"
        aria-label={dictionary.app.name}
      >
        <defs>
          <linearGradient id="canectt-logo-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--color-brand-stop-start)" />
            <stop offset="50%" stopColor="var(--color-brand-stop-mid)" />
            <stop offset="100%" stopColor="var(--color-brand-stop-end)" />
          </linearGradient>
        </defs>
        <path
          d="M24 6a18 18 0 1 0 12.73 30.73"
          fill="none"
          stroke="url(#canectt-logo-gradient)"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <circle cx="37" cy="11" r="4.5" fill="url(#canectt-logo-gradient)" />
      </svg>
    </button>
  );
}
