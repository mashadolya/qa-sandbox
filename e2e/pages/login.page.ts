import type { Locator, Page } from '@playwright/test';
import { APP_ROUTES } from '../data/app.routes';
import { Language } from '../types/language.types';
import { translator } from '../utils/i18n.utils';

/** Signed out there is no stored locale, so the app always renders the login page in English. */
const t = translator(Language.ENGLISH);

export class LoginPage {
  readonly email: Locator;
  readonly password: Locator;
  readonly submit: Locator;
  readonly error: Locator;
  readonly passwordInput: Locator;

  constructor(private readonly page: Page) {
    this.email = page.getByLabel(t('login.email'));
    this.password = page.getByLabel(t('login.password'));
    this.submit = page.getByRole('button', { name: t('login.submit') });
    this.error = page.getByText(t('login.failed'));
    this.passwordInput = page.locator('input[type="password"]');
  }

  async goto(): Promise<void> {
    await this.page.goto(APP_ROUTES.LOGIN);
  }

  async login(email: string, password: string): Promise<void> {
    await this.email.fill(email);
    await this.password.fill(password);
    await this.submit.click();
  }
}
