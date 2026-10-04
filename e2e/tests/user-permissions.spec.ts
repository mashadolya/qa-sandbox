import { test } from '../fixtures/fixture';
import { Role } from '../types/user.types';
import { APP_ROUTES } from '../data/app.routes';
import { CLIENT_ROW_ACTIONS } from '../data/permissions';

// README: the Accountant can view clients but cannot create/edit/delete them,
// cannot delete time entries and cannot manage users.

test.describe('Accountant permission boundaries', () => {
  test.use({ role: Role.ACCOUNTANT });

  test('cannot create a client: no button, and the URL redirects away', async ({
    clientsSteps,
    dashboardSteps,
  }) => {
    await clientsSteps.openClientList();
    await clientsSteps.expectNewClientButton({ visible: false });

    await dashboardSteps.expectRedirectedToDashboard(APP_ROUTES.CLIENT_NEW);
    await clientsSteps.expectFormHidden();
  });

  test('can only view a client from the row menu (no edit, no delete)', async ({
    clientsSteps,
  }) => {
    await clientsSteps.openClientList();

    await clientsSteps.expectRowMenuItems('BYGGA AS', CLIENT_ROW_ACTIONS[Role.ACCOUNTANT], {
      exact: true,
    });
  });

  test('cannot delete time entries', async ({ timeEntriesSteps }) => {
    await timeEntriesSteps.openWeekOf('2026-05-13');

    await timeEntriesSteps.expectEntriesWithoutDelete();
  });
});

test.describe('Admin counterpart (proves the boundary is role-based)', () => {
  test.use({ role: Role.ADMIN });

  test('admin sees the create, edit and delete affordances', async ({ clientsSteps }) => {
    await clientsSteps.openClientList();
    await clientsSteps.expectNewClientButton();

    await clientsSteps.expectRowMenuItems('BYGGA AS', CLIENT_ROW_ACTIONS[Role.ADMIN], {
      exact: true,
    });
  });
});
