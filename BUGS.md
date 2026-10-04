# Bug reports

19 bugs, most severe first within each area. Every bug except BUG-04, BUG-13 and BUG-14 has a
regression test in `e2e/tests/known-bugs.spec.ts`. It asserts the correct behaviour and is marked
`test.fail()`, so it turns red once the bug is fixed. BUG-04 is reproduced in
`e2e/tests/lookup-race.spec.ts`. BUG-17 and BUG-18 only show with the Norwegian UI, so their
tests run in `npm run e2e:nb`; BUG-19's runs in `npm run e2e`.

Unless stated otherwise: local build, Chromium, English UI, fresh seed (**Reset data**).

| ID | Title | Severity | Area |
|---|---|---|---|
| BUG-01 | Accountant can open user management by URL | High | Users / routing |
| BUG-02 | Accountant can open and save the client edit form by URL | High | Clients / routing |
| BUG-08 | Accountant can delete tasks on the global Tasks screen | High | Tasks |
| BUG-03 | Saving the client edit form wipes the telephone number | High | Clients / edit form |
| BUG-05 | A time entry that ends before it starts is saved with negative duration | Medium | Time entries |
| BUG-04 | Slow earlier org-number lookup overwrites a newer result | Medium | Clients / new client |
| BUG-06 | Dashboard numbers don't update after changes in the same session | Medium | Dashboard |
| BUG-10 | Holidays missing in the week that spans New Year | Medium | Time entries |
| BUG-13 | Deleting a client leaves its tasks and time entries orphaned | Medium | Clients / Tasks |
| BUG-14 | A user can be created with an email that already exists | Medium | Users |
| BUG-07 | Client search ignores org. number and place | Medium | Clients / list |
| BUG-09 | Name sort uses English order for Æ, Ø, Å | Low | Clients / list |
| BUG-11 | A task due today is shown as overdue | Low | Tasks |
| BUG-12 | "Not found" and "service down" show the same lookup message | Low | Clients / new client |
| BUG-15 | Login page stays in the previous user's language after logout | Low | Login / i18n |
| BUG-16 | Time-entry delete button has no accessible name | Low | Time entries / a11y |
| BUG-17 | Client list paginator stays in English in the Norwegian UI | Low | Clients / list / i18n |
| BUG-18 | Icon buttons are announced in English in the Norwegian UI | Low | Shell / Clients / i18n / a11y |
| BUG-19 | Time-entry durations use the Norwegian "t" in every language | Low | Time entries / i18n |

---

### BUG-01

```
Title:     Accountant can open user management by URL
Severity:  High
Area:      Users (/users), routing
Steps:     1. Log in as accountant@qa.test.
           2. Note that "Users" is not in the navigation.
           3. Open /users directly in the address bar.
Expected:  Redirect to /dashboard (same as /clients/new), like any admin-only screen.
Actual:    The Users screen opens. The accountant can create users, including new
           admins, and edit or deactivate existing ones.
Notes:     Role-specific. The route has no adminGuard; only the nav link is hidden.
           Privilege escalation: an accountant can create an admin account and log in with it.
```

### BUG-02

```
Title:     Accountant can open and save the client edit form by URL
Severity:  High
Area:      Clients, /clients/:id/edit
Steps:     1. Log in as accountant@qa.test.
           2. Open /clients/c6/edit (BYGGA AS).
           3. Change the name and press Save.
Expected:  Redirect to /dashboard; accountants cannot edit clients (README).
Actual:    The edit form opens and the change is saved.
Notes:     Role-specific. /clients/new is guarded, /clients/:id/edit is not.
```

### BUG-08

```
Title:     Accountant can delete tasks on the global Tasks screen
Severity:  High
Area:      Tasks (/tasks)
Steps:     1. Log in as accountant@qa.test.
           2. Open Tasks.
           3. Click the delete (bin) icon on any row.
Expected:  No delete action for an accountant (the client page hides it for this role).
Actual:    Every row (12 in the seed) has a delete button and the task is deleted.
Notes:     Role-specific. The two task screens are inconsistent: the client page
           checks isAdmin(), the global list does not. No confirmation dialog either.
```

### BUG-03

```
Title:     Saving the client edit form wipes the telephone number
Severity:  High
Area:      Clients, edit form
Steps:     1. Log in as admin.
           2. Open BYGGA AS (/clients/c6); telephone shows "+47 40555555".
           3. Click Edit; the Telephone field is empty.
           4. Press Save without changing anything, then open the client again.
Expected:  Telephone is still "+47 40555555".
Actual:    Telephone is empty: the stored value was overwritten with "".
Notes:     Silent data loss on every edit of any client. The edit form loads every
           field except telephone.
```

### BUG-05

```
Title:     A time entry that ends before it starts is saved with negative duration
Severity:  Medium
Area:      Time entries
Steps:     1. Log in as accountant.
           2. Open Time entries, pick a client, Start 10:00, End 09:00.
           3. Click Add entry.
Expected:  Validation error "End time must be after start time" (the text exists in
           the translations); entry not saved.
Actual:    The entry is saved with duration "-1t 0m". The negative hours are subtracted
           from "Hours this week" and the billable total on the dashboard.
Notes:     Same for equal start and end (0 minutes).
```

### BUG-04

```
Title:     A slow earlier org-number lookup overwrites the result of a newer one
Severity:  Medium
Area:      Clients, new client form (Brønnøysund lookup)
Steps:     1. Log in as admin, open New client.
           2. Enter 912345688 and click Fetch.
           3. Before it answers, change to 912345696 and click Fetch again.
           4. The second response arrives first, then the first.
Expected:  The form shows the company for the number in the field (912345696).
Actual:    The form ends up with the first company's name/address under the second
           org number. Saving stores a mismatched client.
Notes:     Intermittent by nature (depends on response order); reproduced
           deterministically in lookup-race.spec.ts by holding the first mocked
           response. Responses are applied in arrival order (mergeMap) instead of
           cancelling the outdated request.
```

### BUG-06

```
Title:     Dashboard numbers don't update after changes in the same session
Severity:  Medium
Area:      Dashboard
Steps:     1. Log in as admin; Dashboard shows Total clients 27.
           2. Using the navigation (no reload), create a new client.
           3. Click Dashboard in the navigation.
Expected:  Total clients 28.
Actual:    Still 27. The same applies to hours and billable amounts after logging
           time. A page reload shows the right numbers.
Notes:     The stats are cached for the whole session and never invalidated.
```

### BUG-10

```
Title:     Public holidays are missing in the week that spans New Year
Severity:  Medium
Area:      Time entries, week view
Steps:     1. Set the computer's date to 31 Dec 2025 (or navigate to that week).
           2. Log in as accountant and open Time entries: Week 1 (29 Dec 2025 – 4 Jan 2026).
Expected:  Thursday 1 Jan 2026 is marked "Første nyttårsdag" and logging time on it
           shows the holiday warning.
Actual:    No marker, no warning.
Notes:     Date-specific: only the week that crosses a year boundary. Holidays are
           fetched for the year the week starts in.
```

### BUG-13

```
Title:     Deleting a client leaves its tasks and time entries orphaned
Severity:  Medium
Area:      Clients (delete), Tasks, Time entries
Steps:     1. Log in as admin.
           2. Clients → ÆRLIG FILM → row menu → Delete → confirm.
           3. Open Tasks.
Expected:  Either the delete is blocked while the client has tasks or time entries,
           or they are deleted with it (product decision).
Actual:    "Send MVA-melding" and "Avstem bank" stay on Tasks with an empty Client
           column; the link goes to a page saying "No clients match your search".
           Time entries for the client lose their client name.
Notes:     Not covered by a test until the expected behaviour is decided.
```

### BUG-14

```
Title:     A user can be created with an email that already exists
Severity:  Medium
Area:      Users
Steps:     1. Log in as admin, open Users, click New user.
           2. Email accountant@qa.test, any name and password, Save.
Expected:  Error "A user with this email already exists"; nothing saved.
Actual:    "User saved"; the list shows two users with the same email. Login looks
           up the first match, so one of the two accounts can never log in.
Notes:     Email is not unique in the database and the form doesn't check it.
```

### BUG-07

```
Title:     Client search ignores org. number and place
Severity:  Medium
Area:      Clients, list
Steps:     1. Log in, open Clients.
           2. Type 911599236 (BYGGA AS's org number) in "Search by name, org. number or place".
           3. Clear it and type Stavanger (BYGGA AS's place).
Expected:  BYGGA AS is found both times, as the field label promises.
Actual:    "No clients match your search" both times. Only the name is searched.
```

### BUG-09

```
Title:     Name sort uses English order for Æ, Ø, Å
Severity:  Low
Area:      Clients, list
Steps:     1. Log in, open Clients (sorted by name, ascending).
Expected:  Norwegian alphabet: A…Z, then Æ, Ø, Å. Ascending ends with "Å AVLØSERRING";
           descending starts with it.
Actual:    Å AVLØSERRING, A-DATA AS, Æ HOLDING AS, ÆRLIG FILM… are mixed into the A's.
           Descending starts with TRANSPORT AS.
Notes:     Data-specific (names starting with Æ/Ø/Å); the app is Norwegian-first.
```

### BUG-11

```
Title:     A task due today is shown as overdue
Severity:  Low
Area:      Tasks (client page and global screen)
Steps:     1. Log in, open HA KONSULT AS (/clients/c17).
           2. Look at "Møte med klient", due today.
Expected:  Not highlighted; it becomes overdue tomorrow.
Actual:    Highlighted in red as overdue.
Notes:     Off-by-one: overdue means "due date <= today" instead of "< today".
```

### BUG-12

```
Title:     "Not found" and "service down" show the same lookup message
Severity:  Low
Area:      Clients, new client form
Steps:     1. Log in as admin, open New client.
           2. Enter 912345718 (valid checksum, not registered) and click Fetch.
Expected:  "No company found for that number" (the text exists in the translations).
Actual:    "Lookup failed — you can enter details manually", the same as when the
           register is unreachable. The user can't tell a typo from an outage.
```

### BUG-15

```
Title:     Login page stays in the previous user's language after logout
Severity:  Low
Area:      Login, i18n
Steps:     1. Log in as admin@qa.test (prefers Norwegian); the UI switches to Norwegian.
           2. Log out.
Expected:  Login page in the default language (English) — the next person at the
           computer is not the admin.
Actual:    Login page stays Norwegian ("Logg inn").
```

### BUG-16

```
Title:     Time-entry delete button has no accessible name
Severity:  Low
Area:      Time entries, accessibility
Steps:     1. Log in as admin, open Time entries.
           2. Inspect the bin icon on an entry (or use a screen reader).
Expected:  Button announced as "Delete", like the delete buttons on the Tasks screens.
Actual:    No aria-label and the icon is aria-hidden, so the button has no name at all;
           a screen reader announces just "button".
Notes:     Admin-only (the button is hidden for accountants). There is no confirmation
           dialog either, so a mis-click deletes the entry immediately.
```

### BUG-17

```
Title:     Client list paginator stays in English in the Norwegian UI
Severity:  Low
Area:      Clients, list, i18n
Steps:     1. Log in as admin, switch the language to Norsk.
           2. Open Klienter and look at the paginator under the table.
Expected:  Paginator in Norwegian, e.g. "1 – 10 av 27", "Neste side" / "Forrige side".
Actual:    "1 – 10 of 27", and the buttons are named "Next page" / "Previous page".
Notes:     The app provides no MatPaginatorIntl, so Angular Material's English defaults
           are used in every language.
```

### BUG-18

```
Title:     Icon buttons are announced in English in the Norwegian UI
Severity:  Low
Area:      Toolbar (language button), Clients list (row menu button), i18n, accessibility
Steps:     1. Log in as admin, switch the language to Norsk.
           2. Inspect the toolbar's language button and a client row's ⋮ button
              (or use a screen reader).
Expected:  Norwegian names; the translations already have "Språk" (users.locale) and
           "Handlinger" (clients.actions).
Actual:    aria-label="Language" and aria-label="Client actions", hardcoded in
           shell.html and client-list.html, so a screen reader announces English.
```

### BUG-19

```
Title:     Time-entry durations use the Norwegian "t" in every language
Severity:  Low
Area:      Time entries, i18n
Steps:     1. Log in as accountant (English UI), open Time entries.
           2. Look at the duration of any entry.
Expected:  English UI: "2h 15m"; Norwegian UI: "2t 15m".
Actual:    "2t 15m" in both languages: durationLabel() in time-entries.ts builds the
           string with a hardcoded "t" (timer) instead of a translation.
```
