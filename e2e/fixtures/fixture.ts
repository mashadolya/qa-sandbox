import { test as base, expect } from '@playwright/test';
import { mockExternalApis } from '../utils/external-api.utils';
import { LoginPage } from '../pages/login.page';
import { Shell } from '../pages/components/shell.component';
import { DashboardPage } from '../pages/dashboard.page';
import { ClientFormPage } from '../pages/client/client-form.page';
import { ClientListPage } from '../pages/client/client-list.page';
import { ClientViewPage } from '../pages/client/client-view.page';
import { TaskListPage } from '../pages/tasks/task-list.page';
import { TimeEntriesPage } from '../pages/time-entries.page';
import type { ActiveRole } from '../types/user.types';
import { Language } from '../types/language.types';
import { getAuthFilePath } from '../utils/auth.utils';
import { translator, type Translate } from '../utils/i18n.utils';
import { LoginSteps } from '../steps/login.steps';
import { ClientsSteps } from '../steps/clients.steps';
import { DashboardSteps } from '../steps/dashboard.steps';
import { NavigationSteps } from '../steps/navigation.steps';
import { TimeEntriesSteps } from '../steps/time-entries.steps';
import { TasksSteps } from '../steps/tasks.steps';

interface Options {
  /** Signs the test in with that role's saved session (from auth.setup.ts); null starts signed out. */
  role: ActiveRole | null;
  /** UI language of the run; set per project in playwright.config.ts. */
  language: Language;
}

interface I18n {
  /** Translates a key into the run's UI language, e.g. for expected messages. */
  t: Translate;
}

interface Pages {
  loginPage: LoginPage;
  shell: Shell;
  dashboardPage: DashboardPage;
  clientFormPage: ClientFormPage;
  clientListPage: ClientListPage;
  clientViewPage: ClientViewPage;
  taskListPage: TaskListPage;
  timeEntriesPage: TimeEntriesPage;
}

interface Steps {
  loginSteps: LoginSteps;
  clientsSteps: ClientsSteps;
  navigationSteps: NavigationSteps;
  dashboardSteps: DashboardSteps;
  timeEntriesSteps: TimeEntriesSteps;
  tasksSteps: TasksSteps;
}

export const test = base.extend<Options & I18n & Pages & Steps>({
  role: [null, { option: true }],
  language: [Language.ENGLISH, { option: true }],
  t: async ({ language }, use) => use(translator(language)),

  storageState: async ({ role, language, storageState }, use) => {
    await use(role ? getAuthFilePath(role, language) : storageState);
  },
  context: async ({ context, baseURL }, use) => {
    await mockExternalApis(context, new URL(baseURL!).origin);
    await use(context);
  },

  // Page objects. Fixtures are lazy: each is created only when a test or step asks for it.
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  shell: async ({ page, t }, use) => use(new Shell(page, t)),
  dashboardPage: async ({ page, t }, use) => use(new DashboardPage(page, t)),
  clientFormPage: async ({ page, t }, use) => use(new ClientFormPage(page, t)),
  clientListPage: async ({ page, t }, use) => use(new ClientListPage(page, t)),
  clientViewPage: async ({ page, t }, use) => use(new ClientViewPage(page, t)),
  taskListPage: async ({ page, t }, use) => use(new TaskListPage(page, t)),
  timeEntriesPage: async ({ page, t }, use) => use(new TimeEntriesPage(page, t)),

  // Steps receive exactly the page objects they work with.
  loginSteps: async ({ page, loginPage, shell }, use) =>
    use(new LoginSteps(page, loginPage, shell)),
  clientsSteps: async ({ page, clientFormPage, clientListPage, clientViewPage }, use) =>
    use(new ClientsSteps(page, clientFormPage, clientListPage, clientViewPage)),
  navigationSteps: async ({ shell }, use) => use(new NavigationSteps(shell)),
  dashboardSteps: async ({ page, dashboardPage }, use) =>
    use(new DashboardSteps(page, dashboardPage)),
  timeEntriesSteps: async ({ page, timeEntriesPage }, use) =>
    use(new TimeEntriesSteps(page, timeEntriesPage)),
  tasksSteps: async ({ page, taskListPage, clientViewPage }, use) =>
    use(new TasksSteps(page, taskListPage, clientViewPage)),
});

export { expect };
