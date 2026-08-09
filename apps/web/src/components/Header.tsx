import { useState, useRef, useEffect, type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useTheme, type ThemeMode } from '../theme/ThemeProvider';
import { dictionary } from '../i18n/index';
import { Logo } from './Logo';

/** Botón con efecto de brillo (shine) decorativo en hover. */
function ShineButton({
  children,
  variant = 'ghost',
  onClick,
  to,
  ariaLabel,
}: {
  children: ReactNode;
  variant?: 'primary' | 'ghost';
  onClick?: () => void;
  to?: string;
  ariaLabel?: string;
}) {
  const className = `btn btn-shine ${variant === 'primary' ? 'btn-primary' : 'btn-ghost'}`;
  if (to) {
    return (
      <NavLink to={to} className={className} aria-label={ariaLabel}>
        {children}
      </NavLink>
    );
  }
  return (
    <button type="button" className={className} onClick={onClick} aria-label={ariaLabel}>
      {children}
    </button>
  );
}

function ThemeToggle() {
  const { mode, setMode } = useTheme();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const options: { value: ThemeMode; label: string; icon: string }[] = [
    { value: 'light', label: dictionary.header.theme.light, icon: '☀' },
    { value: 'dark', label: dictionary.header.theme.dark, icon: '☾' },
    { value: 'system', label: dictionary.header.theme.system, icon: '⌂' },
  ];
  const current = options.find((o) => o.value === mode) ?? options[2]!;

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        className="btn btn-ghost px-2"
        aria-label={dictionary.header.theme.toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span aria-hidden="true">{current.icon}</span>
      </button>
      {open && (
        <ul
          role="menu"
          className="absolute right-0 mt-2 w-40 rounded-md border bg-surface shadow-e2"
          style={{ borderColor: 'var(--color-border)' }}
        >
          {options.map((opt) => (
            <li key={opt.value} role="none">
              <button
                type="button"
                role="menuitemradio"
                aria-checked={mode === opt.value}
                onClick={() => {
                  setMode(opt.value);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface-variant"
              >
                <span aria-hidden="true">{opt.icon}</span>
                <span>{opt.label}</span>
                {mode === opt.value && (
                  <span className="ml-auto" aria-hidden="true">
                    ✓
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function Header() {
  return (
    <header
      className="sticky top-0 z-40 border-b bg-surface/90 backdrop-blur"
      style={{ borderColor: 'var(--color-border)' }}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Logo size={28} />

        <nav className="flex items-center gap-2" aria-label="Navegación principal">
          {/* En móvil (<640px) colapsa a solo 'Comenzar'; 'Inicio' se absorbe en el logo. */}
          <span className="hidden sm:block">
            <ShineButton to="/">{dictionary.header.nav.home}</ShineButton>
          </span>
          <ShineButton variant="primary" to="/crear">
            {dictionary.header.nav.start}
          </ShineButton>
        </nav>

        <ThemeToggle />
      </div>
    </header>
  );
}
