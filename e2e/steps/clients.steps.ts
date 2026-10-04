import { expect, test, type Page } from '@playwright/test';
import type { ClientFormPage } from '../pages/client/client-form.page';
import type { ClientListPage } from '../pages/client/client-list.page';
import type { ClientViewPage } from '../pages/client/client-view.page';
import { URL_PATTERNS } from '../data/url-patterns';
import { BRREG_URL_PATTERN } from '../data/external-urls';
import type { MockCompany } from '../data/mocks/companies';
import type { ClientAction, ClientStatus, SortColumn } from '../types/client.types';
import type { AllStatuses } from '../types/filter.types';

export interface ManualClient {
  orgNumber?: string;
  name: string;
}

/** Reusable client list / form / details flows and their expectations. */
export class ClientsSteps {
  constructor(
    private readonly page: Page,
    private readonly clientFormPage: ClientFormPage,
    private readonly clientListPage: ClientListPage,
    private readonly clientViewPage: ClientViewPage,
  ) {}

  // ---- Client list -------------------------------------------------------

  async openClientList(): Promise<void> {
    await this.clientListPage.goto();
  }

  /** Types a search term and waits until the (debounced) filter has been applied. */
  async search(term: string): Promise<void> {
    await test.step(`search clients for "${term}"`, async () => {
      await this.clientListPage.search.fill(term);
      await expect(this.clientListPage.table).toHaveAttribute('data-search', term);
    });
  }

  async goToNextPage(): Promise<void> {
    await this.clientListPage.nextPage.click();
  }

  async filterByStatus(status: ClientStatus | AllStatuses): Promise<void> {
    await test.step(`filter clients by status "${status}"`, async () => {
      await this.clientListPage.filterByStatus(status);
    });
  }

  /**
   * Clicks a sortable column header and waits until the table reports the new
   * sort, so the next assertion never sees the previous order.
   */
  async sortBy(column: SortColumn, expectedDirection: 'asc' | 'desc'): Promise<void> {
    await test.step(`sort clients by ${column} (${expectedDirection})`, async () => {
      await this.clientListPage.sortBy(column);
      await expect(this.clientListPage.table).toHaveAttribute('data-sort-column', column);
      await expect(this.clientListPage.table).toHaveAttribute('data-sort-dir', expectedDirection);
    });
  }

  /** Client names shown on the current page, in table order. */
  async visibleNames(): Promise<string[]> {
    return this.clientListPage.visibleNames();
  }

  /** The paginator shows `range` (e.g. "1 – 10 of 27") and the table holds `rowCount` rows. */
  async expectListPage(range: string, rowCount: number): Promise<void> {
    await test.step(`expect list page ${range}`, async () => {
      await expect(this.clientListPage.pageRange).toHaveText(range);
      await expect(this.clientListPage.rows).toHaveCount(rowCount);
    });
  }

  /** The paginator's range label is in the UI language, not Angular Material's English default. */
  async expectPaginatorTranslated(): Promise<void> {
    await test.step('expect the paginator to be translated', async () => {
      await expect(this.clientListPage.pageRange).toBeVisible(); // precondition: paginator rendered
      await expect(this.clientListPage.pageRange).not.toContainText(' of ');
    });
  }

  /** A client row's actions button is announced with `label`. */
  async expectRowMenuButtonNamed(clientName: string, label: string): Promise<void> {
    const row = await this.clientListPage.find(clientName);
    await expect(this.clientListPage.rowMenuButton(row, label)).toBeVisible();
  }

  async expectOnLastPage(): Promise<void> {
    await expect(this.clientListPage.nextPage).toBeDisabled();
  }

  /** Every visible client name contains `term` (case-insensitive). */
  async expectAllNamesContain(term: string): Promise<void> {
    for (const name of await this.visibleNames()) {
      expect(name.toLowerCase()).toContain(term.toLowerCase());
    }
  }

  /** Exactly `count` rows are shown and each one has the given status. */
  async expectOnlyStatus(status: ClientStatus, count: number): Promise<void> {
    await test.step(`expect ${count} clients with status "${status}"`, async () => {
      await expect(this.clientListPage.rows).toHaveCount(count);
      await expect(this.clientListPage.statusCells(status)).toHaveCount(count);
    });
  }

  async expectNoResults(): Promise<void> {
    await test.step('expect no clients found', async () => {
      await expect(this.clientListPage.rows).toHaveCount(0);
      await expect(this.clientListPage.emptyMessage).toBeVisible();
    });
  }

  async expectClientShown(name: string): Promise<void> {
    await expect(this.clientListPage.row(name)).toHaveCount(1);
  }

  async expectFirstRowContains(text: string): Promise<void> {
    await expect(this.clientListPage.rows.first()).toContainText(text);
  }

  async expectFirstClient(name: string): Promise<void> {
    await expect(this.clientListPage.rows.first().getByRole('link')).toHaveText(name);
  }

  /** Finds the client via search and checks the row contains every given text. */
  async expectClientInList(name: string, ...texts: string[]): Promise<void> {
    await test.step(`expect client ${name} in the list`, async () => {
      const row = await this.clientListPage.find(name);
      for (const text of texts) {
        await expect(row).toContainText(text);
      }
    });
  }

  async expectNewClientButton({ visible = true }: { visible?: boolean } = {}): Promise<void> {
    await expect(this.clientListPage.newClient).toBeVisible({ visible });
  }

  /**
   * Opens the row menu of a client and checks the given actions are offered.
   * With `exact`, no other actions may be present.
   */
  async expectRowMenuItems(
    clientName: string,
    items: ClientAction[],
    { exact = false }: { exact?: boolean } = {},
  ): Promise<void> {
    await test.step(`expect row menu of ${clientName}: ${items.join(', ')}`, async () => {
      await this.clientListPage.openRowMenu(clientName);
      if (exact) {
        await expect(this.clientListPage.rowMenu.items).toHaveCount(items.length);
      }
      for (const item of items) {
        await expect(this.clientListPage.rowMenuItem(item)).toBeVisible();
      }
    });
  }

  // ---- Client form -------------------------------------------------------

  async openNewClientForm(): Promise<void> {
    await this.clientFormPage.gotoNew();
  }

  /** Opens the form via the list's "New client" link (in-app, no reload). */
  async clickNewClient(): Promise<void> {
    await this.clientListPage.newClient.click();
  }

  async openClientDetails(clientId: string): Promise<void> {
    await this.clientViewPage.goto(clientId);
  }

  async openEditForm(clientId: string): Promise<void> {
    await this.clientFormPage.edit(clientId);
  }

  async lookUp(orgNumber: string): Promise<void> {
    await test.step(`look up org. number ${orgNumber}`, async () => {
      await this.clientFormPage.lookUp(orgNumber);
    });
  }

  /** Looks the company up and checks the app asked the register for exactly that number. */
  async lookUpAndExpectRegisterCall(orgNumber: string): Promise<void> {
    await test.step(`look up ${orgNumber} in the register`, async () => {
      const request = this.page.waitForRequest(BRREG_URL_PATTERN);
      await this.clientFormPage.lookUp(orgNumber);
      expect((await request).url()).toMatch(new RegExp(`/enheter/${orgNumber}$`));
    });
  }

  async fillManually({ orgNumber, name }: ManualClient): Promise<void> {
    await test.step(`fill client ${name} manually`, async () => {
      if (orgNumber) {
        await this.clientFormPage.orgNumber.fill(orgNumber);
      }
      await this.clientFormPage.name.fill(name);
    });
  }

  /** Saves the form and waits for the redirect (to the client list by default). */
  async saveClient(expectedUrl: RegExp = URL_PATTERNS.CLIENT_LIST): Promise<void> {
    await test.step('save client', async () => {
      await this.clientFormPage.save.click();
      await expect(this.page).toHaveURL(expectedUrl);
    });
  }

  /** The form fields show the company returned by the register lookup. */
  async expectFormPrefilledWith(company: MockCompany): Promise<void> {
    await test.step(`expect form pre-filled with ${company.name}`, async () => {
      await this.expectFormName(company.name);
      await expect(this.clientFormPage.address).toHaveValue(company.address);
      await expect(this.clientFormPage.postalCode).toHaveValue(company.postnummer);
      await expect(this.clientFormPage.place).toHaveValue(company.poststed);
    });
  }

  async expectFormName(name: string): Promise<void> {
    await expect(this.clientFormPage.name).toHaveValue(name);
  }

  /** The company fields describe `company` while the org. number field shows `orgNumber`. */
  async expectFormShowsCompanyUnderOrgNumber(
    company: MockCompany,
    orgNumber: string,
  ): Promise<void> {
    await test.step(`expect form to show ${company.name} under org. number ${orgNumber}`, async () => {
      await this.expectFormName(company.name);
      await expect(this.clientFormPage.place).toHaveValue(company.poststed);
      await expect(this.clientFormPage.orgNumber).toHaveValue(orgNumber);
    });
  }

  /** Nothing was filled in from the register, so the user has to enter details manually. */
  async expectFormNotPrefilled(): Promise<void> {
    await this.expectFormName('');
  }

  /** The lookup shows a message; with `text` (already translated), exactly that message. */
  async expectLookupMessage(text?: string): Promise<void> {
    await (text
      ? expect(this.clientFormPage.lookupMessage).toHaveText(text)
      : expect(this.clientFormPage.lookupMessage).toBeVisible());
  }

  async expectInvalidOrgNumberError(): Promise<void> {
    await expect(this.clientFormPage.orgNumberError).toBeVisible();
  }

  async expectFormHidden(): Promise<void> {
    await expect(this.clientFormPage.orgNumber).toBeHidden();
  }

  // ---- Client details ----------------------------------------------------

  async expectDetailShown(value: string): Promise<void> {
    await expect(this.clientViewPage.detail(value)).toBeVisible();
  }
}
