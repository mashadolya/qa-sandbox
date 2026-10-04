import { expect, type Locator, type Page } from '@playwright/test';
import { Language, LANGUAGE_NAMES } from '../../types/language.types';
import type { NavLink } from '../../types/navigation.types';
import { readSession } from '../../utils/auth.utils';
import { translator, type Translate } from '../../utils/i18n.utils';
import { MenuComponent } from './menu.component';

/** The toolbar every signed-in screen shares: navigation, language, user menu. */
export class Shell {
  readonly nav: Locator;
  readonly userMenu: Locator;
  readonly menu: MenuComponent;

  constructor(
    private readonly page: Page,
    private readonly t: Translate,
  ) {
    this.nav = page.getByRole('navigation');
    this.userMenu = page.getByTestId('user-menu');
    this.menu = new MenuComponent(page);
  }

  /** A toolbar link; `language` overrides the UI language for screens a real sign-in put in another one. */
  navLink(link: NavLink, language?: Language): Locator {
    const t = language ? translator(language) : this.t;
    return this.nav.getByRole('link', { name: t(`nav.${link}`), exact: true });
  }

  async logout(): Promise<void> {
    await this.userMenu.click();
    await this.menu.item(/log out|logg ut/i).click();
  }

  /** The toolbar's language button, by accessible name ("Language" in every language, BUG-18). */
  languageButton(name = 'Language'): Locator {
    return this.page.getByRole('button', { name });
  }

  /** Switches the UI language via the toolbar and waits until it is persisted in the session. */
  async switchLanguage(language: Language): Promise<void> {
    await this.languageButton().click();
    await this.menu.item(LANGUAGE_NAMES[language]).click();
    await expect.poll(async () => (await readSession(this.page))?.locale).toBe(language);
  }

  async resetData(): Promise<void> {
    await this.page.getByRole('button', { name: this.t('shell.reset') }).click();
  }
}
