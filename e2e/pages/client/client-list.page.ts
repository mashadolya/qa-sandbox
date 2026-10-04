import { expect, type Locator, type Page } from '@playwright/test';
import { APP_ROUTES } from '../../data/app.routes';
import { MenuComponent } from '../components/menu.component';
import { selectOption } from '../components/select.component';
import type { ClientAction, ClientStatus, SortColumn } from '../../types/client.types';
import { ALL_STATUSES, type AllStatuses } from '../../types/filter.types';
import type { Translate, TranslationKey } from '../../utils/i18n.utils';

const SORT_COLUMN_LABELS: Record<SortColumn, TranslationKey> = {
  name: 'clients.colName',
  organizationNumber: 'clients.colOrg',
  status: 'clients.colStatus',
};

export class ClientListPage {
  readonly newClient: Locator;
  readonly search: Locator;
  readonly rows: Locator;
  readonly emptyMessage: Locator;
  readonly nextPage: Locator;
  readonly statusFilter: Locator;
  /** Carries the applied sort and search as `data-sort-column` / `data-sort-dir` / `data-search`. */
  readonly table: Locator;
  /** The paginator's "1 – 10 of 27" label (exposed as a live status region). */
  readonly pageRange: Locator;
  /** The actions menu opened from a row. */
  readonly rowMenu: MenuComponent;

  constructor(
    private readonly page: Page,
    private readonly t: Translate,
  ) {
    this.newClient = page.getByRole('link', { name: t('clients.new') });
    this.search = page.getByRole('textbox', { name: t('clients.search') });
    this.rows = page.getByTestId('client-row');
    this.emptyMessage = page.getByText(t('clients.empty'));
    // The paginator (BUG-17) and the row-menu button (BUG-18) are not translated by the app.
    this.nextPage = page.getByRole('button', { name: 'Next page' });
    this.statusFilter = page.getByRole('combobox', { name: t('clients.status') });
    this.table = page.getByTestId('client-table');
    this.pageRange = page.getByRole('status').filter({ hasText: /\d+ – \d+/ });
    this.rowMenu = new MenuComponent(page);
  }

  async goto(): Promise<void> {
    await this.page.goto(APP_ROUTES.CLIENTS);
    await expect(this.rows.first()).toBeVisible();
  }

  /** Narrows the list with the search box so the row is on the first page. */
  async find(name: string): Promise<Locator> {
    await this.search.fill(name);
    const row = this.row(name);
    await expect(row).toHaveCount(1);
    return row;
  }

  row(name: string): Locator {
    return this.rows.filter({ has: this.page.getByRole('link', { name, exact: true }) });
  }

  /** Client names in the order the table currently shows them. */
  async visibleNames(): Promise<string[]> {
    return this.rows.getByRole('link').allInnerTexts();
  }

  /** Status cells that show `status`. */
  statusCells(status: ClientStatus): Locator {
    return this.rows.getByRole('cell', { name: this.t(`status.${status}`) });
  }

  /** An action in the open row menu. */
  rowMenuItem(action: ClientAction): Locator {
    return this.rowMenu.item(this.t(`clients.${action}`));
  }

  async sortBy(column: SortColumn): Promise<void> {
    await this.page
      .getByRole('columnheader')
      .getByRole('button', { name: this.t(SORT_COLUMN_LABELS[column]), exact: true })
      .click();
  }

  async filterByStatus(status: ClientStatus | AllStatuses): Promise<void> {
    const label =
      status === ALL_STATUSES ? this.t('clients.allStatuses') : this.t(`status.${status}`);
    await selectOption(this.statusFilter, label);
  }

  /** A row's actions-menu button, by accessible name ("Client actions" in every language, BUG-18). */
  rowMenuButton(row: Locator, name = 'Client actions'): Locator {
    return row.getByRole('button', { name });
  }

  async openRowMenu(name: string): Promise<void> {
    await this.rowMenuButton(await this.find(name)).click();
  }
}
