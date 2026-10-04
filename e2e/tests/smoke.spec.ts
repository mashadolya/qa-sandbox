import { test } from '../fixtures/fixture';
import { USERS } from '../data/users';
import { Language } from '../types/language.types';

// Smoke test: log in as the seeded Accountant and confirm the dashboard loads.
test.skip(
  ({ language }) => language !== Language.ENGLISH,
  'A real sign-in shows the user’s own language, not the run’s, so it runs in the English project only',
);

test('logs in and shows the dashboard', async ({ loginSteps, dashboardSteps }) => {
  await loginSteps.openLoginPage();

  await loginSteps.loginAs(USERS.accountant);

  await dashboardSteps.expectDashboardVisible();
});
