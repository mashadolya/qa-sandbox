import { test } from '../fixtures/fixture';
import { USERS } from '../data/users';
import { APP_ROUTES } from '../data/app.routes';
import { Role } from '../types/user.types';
import { Language } from '../types/language.types';

test.describe('Authentication', () => {
  test.skip(
    ({ language }) => language !== Language.ENGLISH,
    'A real sign-in shows the user’s own language, not the run’s, so it runs in the English project only',
  );

  test.beforeEach(async ({ loginSteps }) => {
    await loginSteps.openLoginPage();
  });

  test('admin signs in, sees admin navigation, and signs out', async ({
    loginSteps,
    navigationSteps,
  }) => {
    await loginSteps.loginAs(USERS.admin);
    // The seeded Admin prefers Norwegian, so the UI switches language on login.
    await navigationSteps.expectNavigationFor(Role.ADMIN, { language: Language.NORSK });

    await loginSteps.logout();
    // Not asserting on labels: the login page keeps the previous user's language (see BUGS.md).
    await loginSteps.expectLoginFormVisible();
  });

  test('accountant signs in without admin navigation, and signs out', async ({
    loginSteps,
    navigationSteps,
  }) => {
    await loginSteps.loginAs(USERS.accountant);
    await navigationSteps.expectNavigationFor(Role.ACCOUNTANT);

    await loginSteps.logout();
  });

  test('signing out ends the session: protected pages redirect to login', async ({
    loginSteps,
  }) => {
    await loginSteps.loginAs(USERS.accountant);
    await loginSteps.logout();

    await loginSteps.expectSessionCleared();
    await loginSteps.expectRouteRequiresLogin(APP_ROUTES.CLIENTS);
  });

  test('rejects a wrong password', async ({ loginSteps }) => {
    await loginSteps.submitCredentials(USERS.accountant.email, 'wrong-password');

    await loginSteps.expectLoginRejected();
  });

  test('rejects a deactivated user even with the correct password', async ({ loginSteps }) => {
    await loginSteps.submitCredentials(USERS.inactive.email, USERS.inactive.password);

    await loginSteps.expectLoginRejected();
  });

  test('keeps the session across a page reload', async ({ page, loginSteps }) => {
    await loginSteps.loginAs(USERS.accountant);

    await page.reload();

    await loginSteps.expectSignedIn(USERS.accountant);
  });
});
