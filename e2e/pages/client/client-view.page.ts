import { expect, type Locator, type Page } from '@playwright/test';
import { APP_ROUTES } from '../../data/app.routes';
import type { NewTask } from '../../types/task.types';
import { selectOption } from '../components/select.component';
import type { Translate } from '../../utils/i18n.utils';

/** A single client's page (/clients/:id): details and the client's tasks. */
export class ClientViewPage {
  readonly taskCards: Locator;

  constructor(
    private readonly page: Page,
    private readonly t: Translate,
  ) {
    this.taskCards = page.getByTestId('task-card');
  }

  async goto(clientId: string): Promise<void> {
    await this.page.goto(APP_ROUTES.CLIENT_VIEW(clientId));
    await expect(this.page.getByRole('heading', { name: this.t('tasks.title') })).toBeVisible();
  }

  taskCard(title: string): Locator {
    return this.taskCards.filter({ hasText: title });
  }

  taskDue(title: string): Locator {
    return this.taskCard(title).getByTestId('task-due');
  }

  completeButton(title: string): Locator {
    return this.taskCard(title).getByRole('button', { name: this.t('tasks.complete') });
  }

  /** A value in the client's details list (org. number, telephone, …). */
  detail(value: string): Locator {
    return this.page.getByRole('definition').filter({ hasText: value });
  }

  async createTask(task: NewTask): Promise<void> {
    await this.page.getByRole('button', { name: this.t('tasks.new') }).click();
    await this.page.getByRole('textbox', { name: this.t('tasks.taskTitle') }).fill(task.title);
    if (task.dueDate) {
      await this.page.getByLabel(this.t('tasks.dueDate')).fill(task.dueDate);
    }
    if (task.priority) {
      await selectOption(
        this.page.getByRole('combobox', { name: this.t('tasks.priority') }),
        this.t(`priority.${task.priority}`),
      );
    }
    await this.page.getByRole('button', { name: this.t('tasks.save') }).click();
  }

  async complete(title: string): Promise<void> {
    await this.completeButton(title).click();
  }
}
