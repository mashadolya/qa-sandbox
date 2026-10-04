# Solution notes

## How to run

```bash
npm install
npx playwright install chromium
cp .env.example .env # seeded passwords (the ones from README)
npm run e2e          # English UI; starts the dev server itself (or reuses `npm start`)
npm run e2e:nb       # the same suite with the UI in Norwegian
CI=1 npm run e2e     # same suite against the production build (`npm run build && serve:dist`)
```

Expected result (each run is 2 setup + 49 tests):

- `npm run e2e`: **49 passed, 2 skipped** (BUG-17/BUG-18 only show in Norwegian).
- `npm run e2e:nb`: **42 passed, 9 skipped** (the real-sign-in tests and BUG-19 run in
  English only, see "Language" below).

In each run 14 of them are known-bug tests marked `test.fail()`. They are expected to fail, and Playwright counts an expected
failure as a pass (see below). Seeded passwords are read from `.env`.

Before the Norwegian project was added, checked with three consecutive full runs (`--repeat-each=3`, 140/140, 0 flaky) and one
run against the production build (`CI=1`, 48/48, no retry used).

## What's in `e2e/`

| Spec (`e2e/tests/`) | Covers |
|---|---|
| `auth.setup.ts` | Signs in each role once through the real form, switches to the run's language, saves the session |
| `auth.spec.ts` | **Required 1**: both roles log in and out, the session really ends, wrong password, deactivated user, reload keeps the session |
| `clients/client.spec.ts` | **Required 2**: create a client with the org-number lookup → it shows in the list. Plus: register down, invalid checksum (no request sent), unknown number |
| `user-permissions.spec.ts` | **Required 3**: Accountant can't create clients (no button, URL redirects), row menu is view-only, can't delete time entries. One admin test for contrast |
| `tasks.spec.ts` | Create + complete a task on the client page and on the global Tasks screen, status filter, overdue highlighting |
| `time-entries.spec.ts` | Log an entry, holiday marker and warning, week navigation, holiday API down |
| `clients/client-list.spec.ts` | Pagination (27 rows → 10/10/7, nothing skipped), search resets the page, status filter, empty state, org-number sort |
| `dashboard.spec.ts` | KPIs for a pinned week; EUR conversion with the mocked rate and with the offline fallback |
| `lookup-race.spec.ts` | Deterministic reproduction of the org-lookup race (BUG-04) |
| `known-bugs.spec.ts` | One regression test per reported bug that has a clear expected behaviour |
| `smoke.spec.ts` | The shipped smoke test, rewritten on top of the steps |

### Layers

```
tests/     what is tested: scenario + data, no locators
steps/     reusable business actions and expectations, each wrapped in test.step()
pages/     page objects: locators and single UI interactions, no assertions on outcomes
fixtures/  injects pages and steps, sets the role's storageState and UI language, mocks external APIs
data/ utils/ types/   routes, users, mock companies, API mocks, clock pinning, translations
```

Specs ask for steps through fixtures (`async ({ clientsSteps }) => …`). Because steps
wrap their bodies in `test.step`, the HTML report and the trace read like the scenario
("sign in as admin@qa.test", "sort clients by name (desc)") instead of a list of clicks.
Setup that only one test needs (a route that holds a response, a request counter)
stays in that test.

## Locator strategy

The order I tried things in:

1. **Role + accessible name** (`getByRole('button', { name: 'Save' })`,
   `getByRole('combobox', { name: 'Status' })`, `getByLabel('Date')`). Angular
   Material renders good ARIA (labelled inputs, menus/menuitems, options, the paginator
   status region), and these locators also check that the UI makes sense to assistive
   technology. Most of the suite uses them.
2. **`data-testid` / `data-*`, only where roles can't say what I mean.** Attributes
   only, no behaviour changes, in 7 templates:
  - **Repeated containers** with no accessible name: `client-row`, `task-row`,
    `task-card`, `day-card`, `time-entry`. To find a specific item I filter the
    container by a role inside it (e.g. the row that has the link "BYGGA AS").
  - **State as data attributes** for things only visible as styling:
    `data-status` on task rows/cards, `data-overdue` on due dates, `data-date` (ISO) on
    day cards. Tests then assert facts (`data-overdue="false"`), not CSS classes or red
    text, and find "Thursday 1 Jan" without parsing localized dates.
  - **Applied view state** on the client table: `data-sort-column`, `data-sort-dir`,
    `data-search`. See "Stale DOM" below for why.
  - **Values with no label**: dashboard KPIs (`stat-*`), `week-label`,
    `entry-duration`, the lookup message, the holiday warning and badge.
  - **Controls whose name is unstable or missing**: the user menu (its name is the
    signed-in user's display name), the org-lookup button, and the time-entry delete
    button. That last one has no accessible name at all (BUG-16). I added a test id
    instead of an aria-label, because adding the label would fix a bug I'm reporting.
3. **Never** CSS classes, Material internals (`.mat-mdc-*`), XPath, or `nth()` on
   anything except the ordered week view.

**Language.** The suite runs in either UI language: Playwright projects `en` and `nb`
(`npm run e2e` / `npm run e2e:nb`) set a `language` option, and each has its own setup
project that switches the toolbar to that language and saves one session per role and
language (`.auth/<role>.<lang>.json`). Page objects never contain UI text: they look
labels up by key in the app's own `public/assets/i18n/*.json` through `t('clients.new')`
(`utils/i18n.utils.ts`, keys are type-checked), and enums hold translation keys
(`ClientStatus.ON_HOLD = 'on_hold'`). Specs get `t` and `language` as fixtures for
expected messages, numbers and dates. A few labels the app does not translate (the
"Language" and "Client actions" buttons, the paginator, durations like "2t 15m"; BUG-17 – BUG-19) stay
literal. Signed out the app has no locale, so the login page is always English.
A real sign-in switches to the user's stored preference regardless of the run, so
`auth.spec.ts`, the smoke test and BUG-15 run in the `en` project only; they assert
the Admin's Norwegian nav on purpose, since that's real behaviour. After the Admin
logs out, the login page stays Norwegian (BUG-15), so that one assertion checks the
password field instead of a label.

## Flake strategy

The app has random latency (100–350 ms, every 6th heavy call 0.8–1.2 s), calls three
public APIs, is date-dependent, and keeps in-memory caches. What I did about each:

- **No sleeps, no `waitForTimeout`, no retries.** Every wait is a web-first assertion
  (`toHaveValue`, `toHaveCount`, `toHaveURL`…). These retry until the slow, random
  backend catches up. No retries locally (`CI` allows one), so a flaky test shows up as
  a failure instead of hiding behind a retry.
- **Stale DOM.** A web-first assertion passes as soon as it matches, which includes the
  state *before* the action took effect. Two places in the client list hit this: the
  name sort (re-render after the click) and the search (400 ms debounce). The "first row
  is Å AVLØSERRING" and "BYGGA AS is shown" checks matched the old table and passed even
  though the bugs were present. The fix is to wait for proof that the action was
  applied: the table exposes its applied sort and search term, and the `sortBy` /
  `search` steps wait for those attributes before returning.
- **Fully isolated data.** Each test gets a new browser context, which means an empty
  IndexedDB, so the app re-seeds on first load. Tests can create and delete freely and
  still run in parallel (`fullyParallel`). Signed-in sessions come from `storageState`
  (localStorage only), not from a shared database.
- **Network is closed by default.** The `context` fixture mocks Brønnøysund, Nager.Date
  and Norges Bank with fixed data, and *aborts every other off-origin request* (also
  unmocked paths on those three hosts), including Google Fonts, which could otherwise stall `page.goto`'s load event. A test
  can override one API with `page.route` (page routes win over context routes), e.g.
  to simulate an outage. The mocked companies have valid mod-11 org numbers that are
  not in the seed. The mocked EUR rate (11.75) differs from the app's offline fallback
  (11.5), so the dashboard test can tell a mock hit from a silent fallback.
- **Time is pinned where it matters.** Seed tasks and time entries are relative to
  "today", and ISO weeks and holidays depend on the date. `pinToday()` uses
  `page.clock.install({ time })`, and `timezoneId: 'Europe/Oslo'` + `locale` are fixed
  in the config. Two things I learned the hard way:
  - `clock.setFixedTime` freezes `Date.now()`, so RxJS `debounceTime` never fires and
    the client search silently stops working. `install` starts the clock at that time
    and lets it run.
  - The pinned date must be in the past. Stored sessions expire 8 h after the *real*
    "now", so a future date makes the app treat them as expired.
- **Caches are taken into account.** The client/task lists show cached rows first and
  refresh in the background. Assertions target the final state. The dashboard cache is
  a bug (BUG-06); that test navigates in-app on purpose, because a `page.goto` would
  reload and hide the bug.
- **Races are forced, not hoped for.** The org-lookup race test holds the first mocked
  response behind a promise "gate". It opens the gate only after the second response
  is on screen, so "first request answers last" happens on every run.

## Known bugs in the suite

There are 19 bugs in `BUGS.md`; 16 have a `test.fail()` regression test (14 run in each
language project, since BUG-15/BUG-19 need the English UI and BUG-17/BUG-18 the Norwegian
one), and BUG-04 has its own race test. Each regression test asserts the **correct** behaviour:

- while the bug exists, the test fails and the suite stays green;
- once someone fixes it, the test "unexpectedly passes" and turns red. Delete the
  marker and it is a regression test.

An expected failure is only worth something if it fails for the right reason, so each
test has a precondition step ("form loaded", "search works on name", "admin sees delete
buttons") and I checked every failure message against the report: URL stays `/users`,
12 delete buttons, first row is "TRANSPORT AS", total stays 27, `data-overdue` is "true"…
That check is what found the stale-DOM problem above, and three tests whose locators
pointed at test ids that didn't exist yet.

The race test is the exception. It asserts the buggy outcome directly. The correct
outcome is that the stale response never lands, and you can only prove that by
sleeping. Asserting the symptom is deterministic, and it fails right after a fix.

## What I'd do next

- An API/unit-level check for `isValidOrgNumber` and the ISO-week helpers. They're
  pure functions, and e2e is the wrong layer for edge cases like week 53.
- Turn BUG-13/14 into tests once the expected behaviour is decided (block vs. cascade
  delete, duplicate-email error message).
- Run the suite in CI against the production build (`CI=1`).
