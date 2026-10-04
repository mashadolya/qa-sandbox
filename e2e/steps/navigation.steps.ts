import { expect, test } from '@playwright/test';
import type { Shell } from '../pages/components/shell.component';
import type { Language } from '../types/language.types';
import { NavLink } from '../types/navigation.types';
import type { ActiveRole } from '../types/user.types';
import { NAV_LINKS } from '../data/permissions';

/** `language` overrides the run's UI language, for screens a real sign-in put in the user's own. */
interface LanguageOption {
  language?: Language;
}

/** Flows on the toolbar every signed-in screen shares: navigation, language, data reset. */
export class NavigationSteps {
  constructor(private readonly shell: Shell) {}

  /** In-app navigation (no page reload, so in-memory app state survives). */
  async navigateTo(link: NavLink, { language }: LanguageOption = {}): Promise<void> {
    await test.step(`navigate to ${link}`, async () => {
      await this.shell.navLink(link, language).click();
    });
  }

  async expectNavLinkVisible(link: NavLink, { language }: LanguageOption = {}): Promise<void> {
    await expect(this.shell.navLink(link, language)).toBeVisible();
  }

  async expectNavLinkHidden(link: NavLink, { language }: LanguageOption = {}): Promise<void> {
    await expect(this.shell.navLink(link, language)).toBeHidden();
  }

  /** The toolbar shows exactly the links the role is allowed to use (see data/permissions.ts). */
  async expectNavigationFor(role: ActiveRole, { language }: LanguageOption = {}): Promise<void> {
    await test.step(`expect ${role} navigation`, async () => {
      for (const link of Object.values(NavLink)) {
        await (NAV_LINKS[role].includes(link)
          ? this.expectNavLinkVisible(link, { language })
          : this.expectNavLinkHidden(link, { language }));
      }
    });
  }

  /** The toolbar's language button is announced with `label`. */
  async expectLanguageButtonNamed(label: string): Promise<void> {
    await expect(this.shell.languageButton(label)).toBeVisible();
  }

  async switchLanguage(language: Language): Promise<void> {
    await test.step(`switch language to ${language}`, async () => {
      await this.shell.switchLanguage(language);
    });
  }

  async resetData(): Promise<void> {
    await test.step('reset data', async () => {
      await this.shell.resetData();
    });
  }
}
