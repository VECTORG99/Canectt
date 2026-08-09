import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Landing page', () => {
  test('muestra el título Canectt y el CTA', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Canectt' })).toBeVisible();
    // Hay dos links "Comenzar" (header nav + hero CTA); scopeamos al main.
    const cta = page.getByRole('main').getByRole('link', { name: /comenzar/i });
    await expect(cta).toBeVisible();
  });

  test('navega al creation hub al hacer clic en el CTA', async ({ page }) => {
    await page.goto('/');
    const cta = page.getByRole('main').getByRole('link', { name: /comenzar/i });
    await cta.click();
    await expect(page).toHaveURL(/\/crear/);
  });

  test('no tiene violaciones críticas de accesibilidad (axe)', async ({ page }) => {
    await page.goto('/');
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    // Solo fallar si hay violaciones críticas o serias.
    const critical = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    );
    expect(critical).toEqual([]);
  });
});

test.describe('Theme toggle', () => {
  test('cambia entre claro y oscuro', async ({ page }) => {
    await page.goto('/');
    const toggle = page.getByRole('button', { name: /tema/i });
    await expect(toggle).toBeVisible();
    // Abrir el menú de tema.
    await toggle.click();
    // Las opciones son menuitemradio, no buttons.
    const darkOption = page.getByRole('menuitemradio', { name: /oscuro/i });
    await darkOption.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('cierra el menú con Escape', async ({ page }) => {
    await page.goto('/');
    const toggle = page.getByRole('button', { name: /tema/i });
    await toggle.click();
    await expect(page.getByRole('menu')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('menu')).toBeHidden();
  });
});
