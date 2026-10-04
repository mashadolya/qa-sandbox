import { expect, test, type Page } from '@playwright/test';
import type { NewTimeEntry, TimeEntriesPage } from '../pages/time-entries.page';
import { pinToday } from '../utils/clock.utils';

export class TimeEntriesSteps {
  constructor(
    private readonly page: Page,
    private readonly timeEntriesPage: TimeEntriesPage,
  ) {}

  /**
   * Pins "today" and opens the time sheet on the week containing it.
   * Seed entries are generated relative to today, so pinning keeps them deterministic.
   */
  async openWeekOf(isoDate: string): Promise<void> {
    await test.step(`open time sheet with today = ${isoDate}`, async () => {
      await pinToday(this.page, isoDate);
      await this.timeEntriesPage.goto();
    });
  }

  async goToNextWeek(): Promise<void> {
    await this.timeEntriesPage.nextWeek();
  }

  async goToPreviousWeek(): Promise<void> {
    await this.timeEntriesPage.previousWeek();
  }

  async logEntry(entry: NewTimeEntry): Promise<void> {
    await test.step(`log ${entry.start}–${entry.end} on ${entry.date} for ${entry.client}`, async () => {
      await this.timeEntriesPage.log(entry);
    });
  }

  /** Picks a date in the entry form without submitting it. */
  async selectDate(isoDate: string): Promise<void> {
    await this.timeEntriesPage.date.fill(isoDate);
  }

  /** The day card lists exactly one entry matching the given texts (time range, client, duration…). */
  async expectEntry(isoDate: string, ...texts: string[]): Promise<void> {
    await test.step(`expect entry on ${isoDate}: ${texts.join(', ')}`, async () => {
      let entry = this.timeEntriesPage.entriesOn(isoDate);
      for (const text of texts) {
        entry = entry.filter({ hasText: text });
      }
      await expect(entry).toHaveCount(1);
    });
  }

  async expectValidationError(message: string): Promise<void> {
    await expect(this.page.getByText(message)).toBeVisible();
  }

  async expectWeek(label: string, ...isoDates: string[]): Promise<void> {
    await test.step(`expect ${label} is shown`, async () => {
      await expect(this.timeEntriesPage.weekLabel).toHaveText(label);
      for (const date of isoDates) {
        await expect(this.timeEntriesPage.day(date)).toBeVisible();
      }
    });
  }

  async expectHoliday(isoDate: string, name: string): Promise<void> {
    await expect(this.timeEntriesPage.holidayBadge(isoDate)).toContainText(name);
  }

  async expectNoHoliday(isoDate: string): Promise<void> {
    await expect(this.timeEntriesPage.day(isoDate)).toBeVisible();
    await expect(this.timeEntriesPage.holidayBadge(isoDate)).toHaveCount(0);
  }

  async expectHolidayWarning(name: string): Promise<void> {
    await expect(this.timeEntriesPage.holidayWarning).toContainText(name);
  }

  async expectNoHolidayWarning(): Promise<void> {
    await expect(this.timeEntriesPage.holidayWarning).toBeHidden();
  }

  /** Entries are listed, but none of them can be deleted. */
  async expectEntriesWithoutDelete(): Promise<void> {
    await test.step('expect entries without delete buttons', async () => {
      await expect(this.timeEntriesPage.entries.first()).toBeVisible();
      await expect(this.timeEntriesPage.deleteButtons).toHaveCount(0);
    });
  }

  async expectDeleteButtonsShown(): Promise<void> {
    await expect(this.timeEntriesPage.deleteButtons.first()).toBeVisible();
  }

  /** The delete button is announced to assistive technology as "Delete". */
  async expectAccessibleDeleteButton(): Promise<void> {
    await expect(this.timeEntriesPage.namedDeleteButtons.first()).toBeVisible();
  }
}
