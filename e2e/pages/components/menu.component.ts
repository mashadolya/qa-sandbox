import type { Locator, Page } from '@playwright/test';

/** An open Material menu (`role="menu"`): row actions, user menu, language menu. */
export class MenuComponent {
  readonly root: Locator;
  readonly items: Locator;

  constructor(page: Page) {
    this.root = page.getByRole('menu');
    this.items = this.root.getByRole('menuitem');
  }

  item(name: string | RegExp): Locator {
    return this.root.getByRole('menuitem', { name });
  }
}
