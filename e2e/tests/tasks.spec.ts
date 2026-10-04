import { test } from '../fixtures/fixture';
import { Role } from '../types/user.types';
import { TaskPriority, TaskStatus } from '../types/task.types';
import { formatShortDate } from '../utils/i18n.utils';

// Seed tasks are generated relative to "today", so every test pins it.
const TODAY = '2026-05-13';
const CLIENT_PAGE_TASK = 'E2E: Årsavslutning';
const TASKS_SCREEN_TASK = 'E2E: Avstem kasse';

test.use({ role: Role.ACCOUNTANT });

test.describe('Tasks on a client page', () => {
  test('creates a task and marks it complete', async ({ tasksSteps, language, t }) => {
    await tasksSteps.openClientTasks('c6', TODAY); // BYGGA AS

    await tasksSteps.createTask({
      title: CLIENT_PAGE_TASK,
      dueDate: '2026-05-20',
      priority: TaskPriority.HIGH,
    });
    await tasksSteps.expectCardWithStatus(CLIENT_PAGE_TASK, TaskStatus.TODO);
    await tasksSteps.expectCardShows(
      CLIENT_PAGE_TASK,
      t('priority.high'),
      formatShortDate('2026-05-20', language),
    );

    await tasksSteps.completeOnClientPage(CLIENT_PAGE_TASK);

    await tasksSteps.expectCardWithStatus(CLIENT_PAGE_TASK, TaskStatus.DONE);
  });

  test('highlights only open tasks whose due date has passed', async ({ tasksSteps }) => {
    await tasksSteps.openClientTasks('c1', TODAY); // ÆRLIG FILM

    await tasksSteps.expectOverdue('Send MVA-melding'); // due 3 days ago
    await tasksSteps.expectOverdue('Avstem bank', { overdue: false }); // due in 2 days
  });

  test('a completed task is never overdue', async ({ tasksSteps }) => {
    await tasksSteps.openClientTasks('c3', TODAY); // ØDE Ø AS

    await tasksSteps.expectCardWithStatus('Lønnskjøring', TaskStatus.DONE);
    await tasksSteps.expectOverdue('Lønnskjøring', { overdue: false }); // due 10 days ago, but done
  });
});

test.describe('Global Tasks screen', () => {
  test('a task created on a client page can be completed on the Tasks screen', async ({
    tasksSteps,
  }) => {
    await tasksSteps.openClientTasks('c6', TODAY);
    await tasksSteps.createTask({ title: TASKS_SCREEN_TASK });

    await tasksSteps.openTaskList();
    await tasksSteps.expectInListWithStatus(TASKS_SCREEN_TASK, TaskStatus.TODO);

    await tasksSteps.completeInList(TASKS_SCREEN_TASK);

    await tasksSteps.expectInListWithStatus(TASKS_SCREEN_TASK, TaskStatus.DONE);
    await tasksSteps.expectCompleteButtonInList(TASKS_SCREEN_TASK, { visible: false });
  });

  test('status filter shows only matching tasks', async ({ tasksSteps }) => {
    await tasksSteps.openTaskList();

    await tasksSteps.filterByStatus(TaskStatus.DONE);

    await tasksSteps.expectListOnlyStatus(TaskStatus.DONE, 2);
  });
});
