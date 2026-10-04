import { expect, test, type Page } from '@playwright/test';
import type { DashboardPage } from '../pages/dashboard.page';
import { URL_PATTERNS } from '../data/url-patterns';
import { pinToday } from '../utils/clock.utils';

/** Dashboard KPI values exactly as rendered (in the UI language's number format). */
export interface DashboardStats {
  activeClients?: string;
  totalClients?: string;
  hoursThisWeek?: string;
  billableNok?: string;
  billableEur?: string;
}

export class DashboardSteps {
  constructor(
    private readonly page: Page,
    private readonly dashboardPage: DashboardPage,
  ) {}

  /** Opens the dashboard; with `today`, the browser clock is pinned first. */
  async openDashboard(today?: string): Promise<void> {
    await test.step('open dashboard', async () => {
      if (today) {
        await pinToday(this.page, today);
      }
      await this.dashboardPage.goto();
    });
  }

  async expectDashboardVisible(): Promise<void> {
    await expect(this.dashboardPage.heading).toBeVisible();
  }

  /** Opening `route` bounces the user to the dashboard (route guard). */
  async expectRedirectedToDashboard(route: string): Promise<void> {
    await test.step(`expect ${route} to redirect to the dashboard`, async () => {
      await this.page.goto(route);
      await expect(this.page).toHaveURL(URL_PATTERNS.DASHBOARD);
      await this.expectDashboardVisible();
    });
  }

  async expectTotalClients(count: number): Promise<void> {
    await expect(this.dashboardPage.totalClients).toHaveText(String(count));
  }

  async expectStats(stats: DashboardStats): Promise<void> {
    await test.step('expect dashboard KPIs', async () => {
      const locators = {
        activeClients: this.dashboardPage.activeClients,
        totalClients: this.dashboardPage.totalClients,
        hoursThisWeek: this.dashboardPage.hoursThisWeek,
        billableNok: this.dashboardPage.billableNok,
        billableEur: this.dashboardPage.billableEur,
      };
      for (const [key, value] of Object.entries(stats)) {
        await expect(locators[key as keyof DashboardStats]).toContainText(value);
      }
    });
  }
}
