import { test, expect } from '../fixtures/fixture';
import { Role } from '../types/user.types';
import { URL_PATTERNS } from '../data/url-patterns';
import { APP_ROUTES } from '../data/app.routes';
import { UNKNOWN_ORG_NUMBER } from '../data/mocks/companies';
import { USERS } from '../data/users';
import { NavLink } from '../types/navigation.types';
import { Language } from '../types/language.types';

// Regression tests for the bugs in BUGS.md.
//
// Each test asserts the CORRECT behaviour and is marked `test.fail()`, so the
// suite stays green while the bug exists and the test flips to "unexpectedly
// passed" (red) the moment someone fixes it — the signal to drop the marker.
// Every assertion here fails deterministically (no timing dependence).

test.describe('Known bugs: permissions', () => {
  test.use({ role: Role.ACCOUNTANT });

  test('BUG-01: accountant cannot open user management by URL', async ({ page }) => {
    test.fail(true, 'BUG-01: /users has no admin guard');
    await page.goto(APP_ROUTES.USERS);

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page).toHaveURL(URL_PATTERNS.DASHBOARD);
  });

  test('BUG-02: accountant cannot open the client edit form by URL', async ({
    page,
    clientsSteps,
  }) => {
    test.fail(true, 'BUG-02: /clients/:id/edit has no admin guard');
    await clientsSteps.openEditForm('c6');

    await expect(page).toHaveURL(URL_PATTERNS.DASHBOARD);
  });

  test('BUG-08: accountant cannot delete tasks on the global Tasks screen', async ({
    tasksSteps,
  }) => {
    test.fail(true, 'BUG-08: delete button not role-gated on /tasks');
    await tasksSteps.openTaskList(); // precondition: task rows are rendered

    await tasksSteps.expectNoDeleteButtons();
  });
});

test.describe('Known bugs: clients', () => {
  test.use({ role: Role.ADMIN });

  test('BUG-03: saving the edit form keeps the client telephone number', async ({
    clientsSteps,
  }) => {
    test.fail(
      true,
      'BUG-03: telephone is not loaded into the edit form and is overwritten with ""',
    );
    await clientsSteps.openEditForm('c6');
    await clientsSteps.expectFormName('BYGGA AS'); // form has loaded the client

    await clientsSteps.saveClient();
    await clientsSteps.openClientDetails('c6');
    await clientsSteps.expectDetailShown('911599236'); // details loaded

    await clientsSteps.expectDetailShown('+47 40555555');
  });

  test('BUG-07: search matches org. number and place, as its label promises', async ({
    clientsSteps,
  }) => {
    test.fail(true, 'BUG-07: search only filters on name');
    await clientsSteps.openClientList();
    await clientsSteps.search('BYGGA');
    await clientsSteps.expectClientShown('BYGGA AS'); // precondition: search works on name

    await clientsSteps.search('911599236');
    await clientsSteps.expectClientShown('BYGGA AS');

    await clientsSteps.search('Stavanger');
    await clientsSteps.expectClientShown('BYGGA AS');
  });

  test('BUG-09: name sort uses Norwegian alphabet order (Æ, Ø, Å after Z)', async ({
    clientsSteps,
  }) => {
    test.fail(true, "BUG-09: sort uses localeCompare(…, 'en')");
    await clientsSteps.openClientList();

    await clientsSteps.sortBy('name', 'desc'); // already sorted by name ascending

    await clientsSteps.expectFirstClient('Å AVLØSERRING');
  });

  test('BUG-12: an org number the register does not know says "not found"', async ({
    clientsSteps,
    t,
  }) => {
    test.fail(true, 'BUG-12: 404 and network failure are reported the same way');
    await clientsSteps.openNewClientForm();

    await clientsSteps.lookUp(UNKNOWN_ORG_NUMBER);
    await clientsSteps.expectLookupMessage(); // precondition: the lookup answered

    await clientsSteps.expectLookupMessage(t('clientForm.lookupNotFound'));
  });

  test('BUG-06: dashboard reflects a client created in the same session', async ({
    dashboardSteps,
    navigationSteps,
    clientsSteps,
  }) => {
    test.fail(true, 'BUG-06: dashboard aggregates are cached for the whole session');
    await dashboardSteps.openDashboard();
    await dashboardSteps.expectTotalClients(27);

    // In-app navigation (no reload) — a reload would drop the in-memory cache and hide the bug.
    await navigationSteps.navigateTo(NavLink.CLIENTS);
    await clientsSteps.clickNewClient();
    await clientsSteps.fillManually({ orgNumber: '912345726', name: 'DASHBOARD TEST AS' });
    await clientsSteps.saveClient();
    await navigationSteps.navigateTo(NavLink.DASHBOARD);

    await dashboardSteps.expectTotalClients(28);
  });
});

test.describe('Known bugs: sign-in', () => {
  test.skip(
    ({ language }) => language !== Language.ENGLISH,
    'A real sign-in shows the user’s own language, not the run’s, so it runs in the English project only',
  );

  test('BUG-15: the login page is shown in English after a Norwegian user logs out', async ({
    loginSteps,
    navigationSteps,
  }) => {
    test.fail(true, 'BUG-15: logout keeps the previous user’s UI language');
    await loginSteps.openLoginPage();
    await loginSteps.loginAs(USERS.admin);
    await navigationSteps.expectNavLinkVisible(NavLink.USERS, { language: Language.NORSK }); // precondition: UI is Norwegian

    await loginSteps.logout();

    await loginSteps.expectSignInButton('Sign in');
  });
});

test.describe('Known bugs: accessibility', () => {
  test.use({ role: Role.ADMIN });

  test('BUG-16: the time-entry delete button has an accessible name', async ({
    timeEntriesSteps,
  }) => {
    test.fail(true, 'BUG-16: icon-only delete button has no aria-label');
    await timeEntriesSteps.openWeekOf('2026-05-13');
    await timeEntriesSteps.expectDeleteButtonsShown(); // precondition: admin sees delete buttons

    await timeEntriesSteps.expectAccessibleDeleteButton();
  });
});

test.describe('Known bugs: dates', () => {
  test.use({ role: Role.ACCOUNTANT });

  test('BUG-05: a time entry that ends before it starts is rejected', async ({
    timeEntriesSteps,
    t,
  }) => {
    test.fail(true, 'BUG-05: no end > start validation; a negative duration is saved');
    await timeEntriesSteps.openWeekOf('2026-05-13');

    await timeEntriesSteps.logEntry({
      date: '2026-05-13',
      client: 'BYGGA AS',
      start: '10:00',
      end: '09:00',
    });

    await timeEntriesSteps.expectValidationError(t('time.durationInvalid'));
  });

  test('BUG-10: New Year’s Day is marked in the week that spans the year boundary', async ({
    timeEntriesSteps,
    t,
  }) => {
    test.fail(true, 'BUG-10: holidays are fetched only for the year the week starts in');
    // ISO week 1 of 2026: Mon 29 Dec 2025 – Sun 4 Jan 2026
    await timeEntriesSteps.openWeekOf('2025-12-31');
    await timeEntriesSteps.expectWeek(`${t('time.week')} 1`, '2026-01-01');

    await timeEntriesSteps.expectHoliday('2026-01-01', 'Første nyttårsdag');
  });

  test('BUG-11: a task due today is not shown as overdue', async ({ tasksSteps }) => {
    test.fail(true, 'BUG-11: overdue check uses <= today instead of < today');
    // HA KONSULT AS: "Møte med klient" is due today
    await tasksSteps.openClientTasks('c17', '2026-05-13');

    await tasksSteps.expectOverdue('Møte med klient', { overdue: false });
  });
});

test.describe('Known bugs: i18n (Norwegian UI)', () => {
  test.use({ role: Role.ADMIN });
  test.skip(
    ({ language }) => language !== Language.NORSK,
    'Only visible with the Norwegian UI (npm run e2e:nb)',
  );

  test('BUG-17: the client list paginator is translated', async ({ clientsSteps }) => {
    test.fail(true, 'BUG-17: no MatPaginatorIntl, so Material’s English labels are shown');
    await clientsSteps.openClientList();

    await clientsSteps.expectPaginatorTranslated();
  });

  test('BUG-18: icon buttons have names in the UI language', async ({
    clientsSteps,
    navigationSteps,
    t,
  }) => {
    test.fail(true, 'BUG-18: aria-labels "Language" and "Client actions" are hardcoded');
    await clientsSteps.openClientList(); // waits until the rows are rendered

    await navigationSteps.expectLanguageButtonNamed(t('users.locale'));
    await clientsSteps.expectRowMenuButtonNamed('BYGGA AS', t('clients.actions'));
  });
});

test.describe('Known bugs: i18n (English UI)', () => {
  test.use({ role: Role.ACCOUNTANT });
  test.skip(
    ({ language }) => language !== Language.ENGLISH,
    'Only visible with the English UI (npm run e2e)',
  );

  test('BUG-19: a duration reads "2h 15m" in the English UI', async ({ timeEntriesSteps }) => {
    test.fail(true, 'BUG-19: durationLabel() hardcodes the Norwegian "t" (timer)');
    await timeEntriesSteps.openWeekOf('2026-05-13');
    await timeEntriesSteps.logEntry({
      date: '2026-05-14',
      client: 'BYGGA AS',
      start: '10:00',
      end: '12:15',
      comment: 'E2E: BUG-19',
    });
    await timeEntriesSteps.expectEntry('2026-05-14', 'E2E: BUG-19'); // precondition: entry saved

    await timeEntriesSteps.expectEntry('2026-05-14', 'E2E: BUG-19', '2h 15m');
  });
});
