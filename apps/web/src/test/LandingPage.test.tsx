import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../theme/ThemeProvider';
import LandingPage from '../pages/LandingPage';
import { dictionary } from '../i18n/index';

afterEach(() => cleanup());

describe('LandingPage', () => {
  it('muestra el título Canectt', () => {
    render(
      <ThemeProvider>
        <MemoryRouter>
          <LandingPage />
        </MemoryRouter>
      </ThemeProvider>,
    );
    expect(screen.getByText('Canectt')).toBeTruthy();
  });

  it('tiene un CTA con texto no vacío', () => {
    render(
      <ThemeProvider>
        <MemoryRouter>
          <LandingPage />
        </MemoryRouter>
      </ThemeProvider>,
    );
    const cta = screen.getByText(dictionary.landing.hero.cta);
    expect(cta.tagName).toBe('A');
    expect(cta.getAttribute('href')).toBe('/crear');
  });
});
