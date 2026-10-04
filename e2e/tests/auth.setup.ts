import { test as setup } from '../fixtures/fixture';
import { USERS } from '../data/users';
import { ACTIVE_ROLES } from '../types/user.types';
import { getAuthFilePath } from '../utils/auth.utils';

// Signs each role in once through the real login form and saves the session,
// so feature tests start authenticated without repeating the UI login.
// The UI language is switched to the project's (`en` or `nb`) before saving:
// each seeded user has their own preferred locale, but a run uses one language.
ACTIVE_ROLES.forEach((role) => {
  setup(
    `sign in as ${role}`,
    async ({ page, language, loginSteps, navigationSteps, dashboardSteps }) => {
      await loginSteps.openLoginPage();
      await loginSteps.loginAs(USERS[role]);

      await navigationSteps.switchLanguage(language);
      await navigationSteps.resetData();
      await dashboardSteps.expectDashboardVisible();

      await page.context().storageState({ path: getAuthFilePath(role, language) });
    },
  );
});
