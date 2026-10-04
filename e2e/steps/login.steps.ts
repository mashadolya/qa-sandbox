import { expect, test, type Page } from '@playwright/test';
import type { LoginPage } from '../pages/login.page';
import type { Shell } from '../pages/components/shell.component';
import { URL_PATTERNS } from '../data/url-patterns';
import type { User } from '../types/auth.types';
import { readSession } from '../utils/auth.utils';

/** Reusable sign-in / sign-out flows and their expectations. */
export class LoginSteps {
  constructor(
    private readonly page: Page,
    private readonly loginPage: LoginPage,
    private readonly shell: Shell,
  ) {}

  async openLoginPage(): Promise<void> {
    await this.loginPage.goto();
  }

  /** Submits the login form without asserting the outcome (for negative cases). */
  async submitCredentials(email: string, password: string): Promise<void> {
    await test.step(`submit credentials for ${email}`, async () => {
      await this.loginPage.login(email, password);
    });
  }

  /** Signs in through the form and waits until the user lands on the dashboard. */
  async loginAs(user: User): Promise<void> {
    await test.step(`sign in as ${user.email}`, async () => {
      await this.loginPage.login(user.email, user.password);
      await this.expectSignedIn(user);
    });
  }

  async expectSignedIn(user: User): Promise<void> {
    await test.step(`expect signed in as ${user.displayName}`, async () => {
      await expect(this.page).toHaveURL(URL_PATTERNS.DASHBOARD);
      await expect(this.shell.userMenu).toContainText(user.displayName);
    });
  }

  async logout(): Promise<void> {
    await test.step('sign out', async () => {
      await this.shell.logout();
      await this.expectOnLoginPage();
    });
  }

  /** The app removed the stored session, not just the UI state. */
  async expectSessionCleared(): Promise<void> {
    await test.step('expect the stored session to be removed', async () => {
      await expect.poll(() => readSession(this.page)).toBeNull();
    });
  }

  async expectOnLoginPage(): Promise<void> {
    await expect(this.page).toHaveURL(URL_PATTERNS.LOGIN);
  }

  /** The login form itself is shown (language-independent check). */
  async expectLoginFormVisible(): Promise<void> {
    await expect(this.loginPage.passwordInput).toBeVisible();
  }

  /** The submit button carries the given (language-dependent) label. */
  async expectSignInButton(label: string): Promise<void> {
    await expect(this.page.getByRole('button', { name: label })).toBeVisible();
  }

  /** The form shows an error and the user stays on the login page. */
  async expectLoginRejected(): Promise<void> {
    await test.step('expect sign-in to be rejected', async () => {
      await expect(this.loginPage.error).toBeVisible();
      await this.expectOnLoginPage();
    });
  }

  /** Opening a protected route while signed out lands on the login page, also after a reload. */
  async expectRouteRequiresLogin(route: string): Promise<void> {
    await test.step(`expect ${route} to require login`, async () => {
      await this.page.goto(route);
      await this.expectOnLoginPage();
      await this.page.reload();
      await this.expectOnLoginPage();
    });
  }
}
