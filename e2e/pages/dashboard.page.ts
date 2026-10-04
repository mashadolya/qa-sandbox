import type { Locator, Page } from '@playwright/test';
import { APP_ROUTES } from '../data/app.routes';
import type { Translate } from '../utils/i18n.utils';

export class DashboardPage {
  readonly heading: Locator;
  readonly activeClients: Locator;
  readonly totalClients: Locator;
  readonly hoursThisWeek: Locator;
  readonly billableNok: Locator;
  readonly billableEur: Locator;

  constructor(
    private readonly page: Page,
    t: Translate,
  ) {
    this.heading = page.getByRole('heading', { name: t('dashboard.title') });
    this.activeClients = page.getByTestId('stat-active-clients');
    this.totalClients = page.getByTestId('stat-total-clients');
    this.hoursThisWeek = page.getByTestId('stat-hours-week');
    this.billableNok = page.getByTestId('stat-billable-nok');
    this.billableEur = page.getByTestId('stat-billable-eur');
  }

  async goto(): Promise<void> {
    await this.page.goto(APP_ROUTES.DASHBOARD);
  }
}
