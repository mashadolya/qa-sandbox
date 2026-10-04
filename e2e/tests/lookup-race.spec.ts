import { test } from '../fixtures/fixture';
import { Role } from '../types/user.types';
import { COMPANIES } from '../data/mocks/companies';
import { BRREG_URL_PATTERN } from '../data/external-urls';

const STALE = COMPANIES.fjord;
const CURRENT = COMPANIES.nordlys;
/** Register URL of the first lookup, the one whose response is held back. */
const STALE_URL = BRREG_URL_PATTERN.replace('**', STALE.orgNumber);

test.use({ role: Role.ADMIN });

// BUG-04. The client form pipes lookups through `mergeMap`, so every response
// is applied in arrival order. If an earlier lookup is slower than a later one,
// the stale company overwrites the one the user actually asked for.
//
// Timing is not left to chance: the mocked register holds the first response
// behind a gate we open only after the second one has been rendered, which
// makes "first request answers last" happen on every run.
//
// This test asserts the buggy outcome, deliberately. The correct outcome is
// "the stale response never lands", and proving a negative needs a sleep;
// asserting the symptom is the only fully deterministic check. When the bug is
// fixed (e.g. `switchMap`), the first request is cancelled, the stale response
// is never applied, and this test fails — then invert it into a regression test.
test('BUG-04: a slow earlier lookup overwrites the result of a newer one', async ({
  page,
  clientsSteps,
}) => {
  // Only the stale lookup is intercepted: it waits for the gate, then falls back
  // to the context mock. A fixed app may have cancelled it by then; that's fine.
  const { promise: gate, resolve: openGate } = Promise.withResolvers<void>();
  await page.route(STALE_URL, async (route) => {
    await gate;
    await route.fallback().catch(() => {});
  });
  await clientsSteps.openNewClientForm();

  // 1st lookup — its response is held back.
  const staleRequest = page.waitForRequest(STALE_URL);
  await clientsSteps.lookUp(STALE.orgNumber);
  await staleRequest;

  // User corrects the number and looks up again — answered immediately.
  await clientsSteps.lookUp(CURRENT.orgNumber);
  await clientsSteps.expectFormName(CURRENT.name);

  // Now the first response arrives, late.
  const staleResponse = page.waitForResponse(STALE_URL);
  openGate();
  await staleResponse;

  // The form now describes a different company than the org number it shows.
  await clientsSteps.expectFormShowsCompanyUnderOrgNumber(STALE, CURRENT.orgNumber);
});
