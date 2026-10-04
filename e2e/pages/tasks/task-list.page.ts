import { expect, type Locator, type Page } from '@playwright/test';
import { APP_ROUTES } from '../../data/app.routes';
import type { TaskStatus } from '../../types/task.types';
import { ALL_STATUSES, type AllStatuses } from '../../types/filter.types';
import { selectOption } from '../components/select.component';
import type { Translate } from '../../utils/i18n.utils';

/** The global Tasks screen (/tasks). */
export class TaskListPage {
  readonly rows: Locator;
  readonly statusFilter: Locator;

  constructor(
    private readonly page: Page,
    private readonly t: Translate,
  ) {
    this.rows = page.getByTestId('task-row');
    this.statusFilter = page.getByRole('combobox', { name: t('tasks.status') });
  }

  async goto(): Promise<void> {
    await this.page.goto(APP_ROUTES.TASKS);
    await expect(this.rows.first()).toBeVisible();
  }

  row(title: string): Locator {
    return this.rows.filter({ has: this.page.getByRole('cell', { name: title, exact: true }) });
  }

  completeButton(title: string): Locator {
    return this.row(title).getByRole('button', { name: this.t('tasks.complete') });
  }

  taskDue(title: string): Locator {
    return this.row(title).getByTestId('task-due');
  }

  get deleteButtons(): Locator {
    return this.rows.getByRole('button', { name: this.t('tasks.delete') });
  }

  async filterByStatus(status: TaskStatus | AllStatuses): Promise<void> {
    const label =
      status === ALL_STATUSES ? this.t('tasks.allStatuses') : this.t(`taskStatus.${status}`);
    await selectOption(this.statusFilter, label);
  }

  async complete(title: string): Promise<void> {
    await this.completeButton(title).click();
  }
}
