import { test, expect } from '../../fixtures/fixture';
import { Role } from '../../types/user.types';
import { ClientStatus } from '../../types/client.types';

// The seed has 27 clients; the list shows 10 per page. The paginator's
// "1 – 10 of 27" label is not translated by the app (BUG-17), so it is the same in every language.

test.use({ role: Role.ACCOUNTANT });

test.describe('Client list: pagination, filtering, sorting', () => {
  test.beforeEach(async ({ clientsSteps }) => {
    await clientsSteps.openClientList();
  });

  test('pages through all 27 clients, 10 per page', async ({ clientsSteps }) => {
    const seen = new Set<string>();

    await clientsSteps.expectListPage('1 – 10 of 27', 10);
    (await clientsSteps.visibleNames()).forEach((n) => seen.add(n));

    await clientsSteps.goToNextPage();
    await clientsSteps.expectListPage('11 – 20 of 27', 10);
    (await clientsSteps.visibleNames()).forEach((n) => seen.add(n));

    await clientsSteps.goToNextPage();
    await clientsSteps.expectListPage('21 – 27 of 27', 7);
    (await clientsSteps.visibleNames()).forEach((n) => seen.add(n));

    await clientsSteps.expectOnLastPage();
    expect(seen.size).toBe(27); // no client skipped or duplicated across pages
  });

  test('searching from a later page jumps back to page 1', async ({ clientsSteps }) => {
    await clientsSteps.goToNextPage();
    await clientsSteps.goToNextPage();
    await clientsSteps.expectListPage('21 – 27 of 27', 7);

    await clientsSteps.search('regnskap');

    await clientsSteps.expectListPage('1 – 5 of 5', 5);
    await clientsSteps.expectAllNamesContain('regnskap');
  });

  test('status filter shows only matching clients', async ({ clientsSteps }) => {
    await clientsSteps.filterByStatus(ClientStatus.ON_HOLD);

    await clientsSteps.expectOnlyStatus(ClientStatus.ON_HOLD, 3);
  });

  test('a search with no matches says so', async ({ clientsSteps }) => {
    await clientsSteps.search('finnes ikke');

    await clientsSteps.expectNoResults();
  });

  test('sorting by org. number toggles ascending/descending', async ({ clientsSteps }) => {
    await clientsSteps.sortBy('organizationNumber', 'asc');
    await clientsSteps.expectFirstRowContains('814589072'); // lowest in the seed

    await clientsSteps.sortBy('organizationNumber', 'desc');
    await clientsSteps.expectFirstRowContains('997249291'); // highest in the seed
  });
});
