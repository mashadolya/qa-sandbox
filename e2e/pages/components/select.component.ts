import type { Locator } from '@playwright/test';

/** Opens a Material select (`role="combobox"`) and picks the option with exactly this label. */
export async function selectOption(combobox: Locator, option: string): Promise<void> {
  await combobox.click();
  await combobox.page().getByRole('option', { name: option, exact: true }).click();
}
