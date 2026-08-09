import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    // Puerto dedicado para e2e (5180) para evitar colisiones con otros
    // servidores que puedan estar corriendo en 5173 en el entorno local.
    baseURL: 'http://localhost:5180',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'pnpm exec vite --port 5180 --strictPort',
    url: 'http://localhost:5180',
    // No reutilizar: garantiza que levantamos nuestra propia instancia en 5180.
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
