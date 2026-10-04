import { expect, type Locator, type Page } from '@playwright/test';
import { APP_ROUTES } from '../data/app.routes';
import { selectOption } from './components/select.component';
import type { Translate } from '../utils/i18n.utils';

export interface NewTimeEntry {
  date: string; // YYYY-MM-DD
  client: string;
  start: string; // HH:mm
  end: string; // HH:mm
  comment?: string;
}

export class TimeEntriesPage {
  readonly date: Locator;
  readonly client: Locator;
  readonly start: Locator;
  readonly end: Locator;
  readonly comment: Locator;
  readonly add: Locator;
  readonly holidayWarning: Locator;
  readonly weekLabel: Locator;
  readonly entries: Locator;
  readonly deleteButtons: Locator;
  /** Delete buttons found by their accessible name (none today, see BUG-16). */
  readonly namedDeleteButtons: Locator;

  constructor(
    private readonly page: Page,
    private readonly t: Translate,
  ) {
    this.date = page.getByLabel(t('time.date'));
    this.client = page.getByRole('combobox', { name: t('time.client') });
    this.start = page.getByLabel(t('time.start'));
    this.end = page.getByLabel(t('time.end'));
    this.comment = page.getByRole('textbox', { name: t('time.comment') });
    this.add = page.getByRole('button', { name: t('time.add') });
    this.holidayWarning = page.getByTestId('holiday-warning');
    this.weekLabel = page.getByTestId('week-label');
    this.entries = page.getByTestId('time-entry');
    this.deleteButtons = page.getByTestId('time-entry-delete');
    this.namedDeleteButtons = this.entries.getByRole('button', { name: t('time.delete') });
  }

  async goto(): Promise<void> {
    await this.page.goto(APP_ROUTES.TIME);
    await expect(this.day(0)).toBeVisible();
  }

  /** Day card by ISO date, or by position in the displayed week (0 = Monday). */
  day(dateOrIndex: string | number): Locator {
    const cards = this.page.getByTestId('day-card');
    return typeof dateOrIndex === 'number'
      ? cards.nth(dateOrIndex)
      : cards.and(this.page.locator(`[data-date="${dateOrIndex}"]`));
  }

  /** Entries listed on one day card. */
  entriesOn(isoDate: string): Locator {
    return this.day(isoDate).locator(this.entries);
  }

  holidayBadge(isoDate: string): Locator {
    return this.day(isoDate).getByTestId('holiday-badge');
  }

  async fill(entry: NewTimeEntry): Promise<void> {
    await this.date.fill(entry.date);
    await selectOption(this.client, entry.client);
    await this.start.fill(entry.start);
    await this.end.fill(entry.end);
    if (entry.comment) {
      await this.comment.fill(entry.comment);
    }
  }

  async log(entry: NewTimeEntry): Promise<void> {
    await this.fill(entry);
    await this.add.click();
  }

  async previousWeek(): Promise<void> {
    await this.page.getByRole('button', { name: this.t('time.prev') }).click();
  }

  async nextWeek(): Promise<void> {
    await this.page.getByRole('button', { name: this.t('time.next') }).click();
  }
}
