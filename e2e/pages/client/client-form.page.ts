import { expect, type Locator, type Page } from '@playwright/test';
import { APP_ROUTES } from '../../data/app.routes';
import type { Translate } from '../../utils/i18n.utils';

export class ClientFormPage {
  readonly orgNumber: Locator;
  readonly lookup: Locator;
  readonly lookupMessage: Locator;
  readonly name: Locator;
  readonly address: Locator;
  readonly postalCode: Locator;
  readonly place: Locator;
  readonly telephone: Locator;
  readonly save: Locator;
  readonly orgNumberError: Locator;

  constructor(
    private readonly page: Page,
    private readonly t: Translate,
  ) {
    this.orgNumber = page.getByRole('textbox', { name: t('clientForm.orgNumber') });
    this.lookup = page.getByTestId('org-lookup');
    this.lookupMessage = page.getByTestId('lookup-message');
    this.name = page.getByRole('textbox', { name: t('clientForm.name'), exact: true });
    this.address = page.getByRole('textbox', { name: t('clientForm.addressLine') });
    this.postalCode = page.getByRole('textbox', { name: t('clientForm.postnummer') });
    this.place = page.getByRole('textbox', { name: t('clientForm.poststed') });
    this.telephone = page.getByRole('textbox', { name: t('clientForm.telephone') });
    this.save = page.getByRole('button', { name: t('clientForm.save') });
    this.orgNumberError = page.getByText(t('clientForm.orgInvalid'));
  }

  async gotoNew(): Promise<void> {
    await this.page.goto(APP_ROUTES.CLIENT_NEW);
    await expect(
      this.page.getByRole('main').getByText(this.t('clientForm.newTitle'), { exact: true }),
    ).toBeVisible();
  }

  async lookUp(orgNumber: string): Promise<void> {
    await this.orgNumber.fill(orgNumber);
    await this.lookup.click();
  }

  async edit(id: string): Promise<void> {
    await this.page.goto(APP_ROUTES.CLIENT_EDIT(id));
  }
}
