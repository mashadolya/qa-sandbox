require('dotenv').config();
import { defineConfig, devices } from '@playwright/test';
import { Language } from './e2e/types/language.types';

const externalBaseURL = process.env.PLAYWRIGHT_BASE_URL;
const baseURL = externalBaseURL ?? 'http://localhost:4300';

export default defineConfig<{ language: Language }>({
  testDir: './e2e/tests',
  // testMatch: 'lookup-race.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL,
    locale: 'en-GB',
    timezoneId: 'Europe/Oslo',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  // One setup + test project pair per UI language: `npm run e2e` runs English,
  // `npm run e2e:nb` Norwegian (each pulls in its own setup as a dependency).
  projects: Object.values(Language).flatMap((language) => [
    { name: `setup-${language}`, testMatch: /auth\.setup\.ts/, use: { language } },
    {
      name: language,
      use: { ...devices['Desktop Chrome'], language },
      dependencies: [`setup-${language}`],
    },
  ]),
  // Local: dev server (fast, auto-reload, reused if `npm start` is already up);
  // CI: build + serve the production bundle. Skipped entirely when an external
  // base URL is provided.
  webServer: externalBaseURL
    ? undefined
    : {
        command: process.env.CI ? 'npm run build && npm run serve:dist' : 'npm start',
        url: 'http://localhost:4300',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
