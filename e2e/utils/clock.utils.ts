import type { Page } from '@playwright/test';

/**
 * Starts the browser clock at noon UTC of the given ISO date (YYYY-MM-DD) and lets it run.
 * Not `setFixedTime`: a frozen clock stops RxJS debounce, so the client search never fires.
 * Noon keeps the same calendar day in every timezone from UTC-11 to UTC+11.
 */
export async function pinToday(page: Page, isoDate: string): Promise<void> {
  const time = new Date(`${isoDate}T12:00:00Z`);
  if (Number.isNaN(time.getTime()) || time.getTime() > Date.now()) {
    throw new Error(
      `pinToday: "${isoDate}" must be a valid past date (stored sessions expire against the real clock)`,
    );
  }
  await page.clock.install({ time });
}
