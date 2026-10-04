import { expect, test, type Locator, type Page } from '@playwright/test';
import type { TaskListPage } from '../pages/tasks/task-list.page';
import type { ClientViewPage } from '../pages/client/client-view.page';
import { pinToday } from '../utils/clock.utils';
import type { NewTask, TaskStatus } from '../types/task.types';
import type { AllStatuses } from '../types/filter.types';

/** Flows on the global Tasks screen and on a client's task section. */
export class TasksSteps {
  constructor(
    private readonly page: Page,
    private readonly taskListPage: TaskListPage,
    private readonly clientViewPage: ClientViewPage,
  ) {}

  // ---- Global Tasks screen (/tasks) ---------------------------------------

  async openTaskList(): Promise<void> {
    await this.taskListPage.goto();
  }

  async filterByStatus(status: TaskStatus | AllStatuses): Promise<void> {
    await test.step(`filter tasks by status "${status}"`, async () => {
      await this.taskListPage.filterByStatus(status);
    });
  }

  async completeInList(title: string): Promise<void> {
    await test.step(`complete task "${title}" on the Tasks screen`, async () => {
      await this.taskListPage.complete(title);
    });
  }

  async expectInListWithStatus(title: string, status: TaskStatus): Promise<void> {
    await this.expectStatus(this.taskListPage.row(title), status);
  }

  /** Exactly `count` rows are listed and every one has the given status. */
  async expectListOnlyStatus(status: TaskStatus, count: number): Promise<void> {
    await test.step(`expect ${count} tasks with status "${status}"`, async () => {
      await expect(this.taskListPage.rows).toHaveCount(count);
      await expect(
        this.taskListPage.rows.and(this.page.locator(`[data-status="${status}"]`)),
      ).toHaveCount(count);
    });
  }

  async expectCompleteButtonInList(
    title: string,
    { visible = true }: { visible?: boolean } = {},
  ): Promise<void> {
    await expect(this.taskListPage.completeButton(title)).toBeVisible({ visible });
  }

  async expectNoDeleteButtons(): Promise<void> {
    await expect(this.taskListPage.deleteButtons).toHaveCount(0);
  }

  async expectDeleteButtonsShown(): Promise<void> {
    await expect(this.taskListPage.deleteButtons.first()).toBeVisible();
  }

  async expectOverdueInList(
    title: string,
    { overdue = true }: { overdue?: boolean } = {},
  ): Promise<void> {
    await this.expectOverdueFlag(this.taskListPage.taskDue(title), overdue);
  }

  // ---- A client's own view (/clients/:id) ---------------------------------

  /** Opens a client's tasks; with `today`, the browser clock is pinned first. */
  async openClientTasks(clientId: string, today?: string): Promise<void> {
    await test.step(`open tasks of client ${clientId}`, async () => {
      if (today) {
        await pinToday(this.page, today);
      }
      await this.clientViewPage.goto(clientId);
    });
  }

  async createTask(task: NewTask): Promise<void> {
    await test.step(`create task "${task.title}"`, async () => {
      await this.clientViewPage.createTask(task);
      await expect(this.clientViewPage.taskCard(task.title)).toBeVisible();
    });
  }

  async completeOnClientPage(title: string): Promise<void> {
    await test.step(`complete task "${title}" on the client page`, async () => {
      await this.clientViewPage.complete(title);
    });
  }

  async expectCardWithStatus(title: string, status: TaskStatus): Promise<void> {
    await this.expectStatus(this.clientViewPage.taskCard(title), status);
  }

  async expectCardShows(title: string, ...texts: string[]): Promise<void> {
    for (const text of texts) {
      await expect(this.clientViewPage.taskCard(title)).toContainText(text);
    }
  }

  async expectOverdue(
    title: string,
    { overdue = true }: { overdue?: boolean } = {},
  ): Promise<void> {
    await this.expectOverdueFlag(this.clientViewPage.taskDue(title), overdue);
  }

  // ---- Shared by both task screens ----------------------------------------

  /** A task row or card carries its status as `data-status`. */
  private async expectStatus(task: Locator, status: TaskStatus): Promise<void> {
    await expect(task).toHaveAttribute('data-status', status);
  }

  /** A due date carries its overdue state as `data-overdue`. */
  private async expectOverdueFlag(due: Locator, overdue: boolean): Promise<void> {
    await expect(due).toHaveAttribute('data-overdue', String(overdue));
  }
}
