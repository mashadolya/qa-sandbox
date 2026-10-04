import { test } from '../fixtures/fixture';
import { Role } from '../types/user.types';
import { HOLIDAYS_URL_PATTERN } from '../data/external-urls';
import { simulateOutage } from '../utils/external-api.utils';

// 13 May 2026 is a Wednesday in ISO week 20 (Mon 11 – Sun 17 May), the week
// of Grunnlovsdag. Holidays come from the mocked Nager.Date API.
const TODAY = '2026-05-13';

test.use({ role: Role.ACCOUNTANT });

test.describe('Time entries', () => {
  // The app renders durations as "2t 15m" in every language (BUG-19).
  test('logs an entry and shows it on the right day with its duration', async ({
    timeEntriesSteps,
  }) => {
    await timeEntriesSteps.openWeekOf(TODAY);

    await timeEntriesSteps.logEntry({
      date: '2026-05-14',
      client: 'BYGGA AS',
      start: '10:00',
      end: '12:15',
      comment: 'E2E: Avstemming',
    });

    await timeEntriesSteps.expectEntry('2026-05-14', 'E2E: Avstemming', 'BYGGA AS', '2t 15m');
  });

  test('marks a public holiday in the week view', async ({ timeEntriesSteps, t }) => {
    await timeEntriesSteps.openWeekOf(TODAY);

    await timeEntriesSteps.expectWeek(`${t('time.week')} 20`, '2026-05-17');
    await timeEntriesSteps.expectHoliday('2026-05-17', 'Grunnlovsdag');
    await timeEntriesSteps.expectNoHoliday('2026-05-13');
  });

  test('warns when the selected date is a public holiday', async ({ timeEntriesSteps }) => {
    await timeEntriesSteps.openWeekOf(TODAY);
    await timeEntriesSteps.expectNoHolidayWarning();

    await timeEntriesSteps.selectDate('2026-05-17');

    await timeEntriesSteps.expectHolidayWarning('Grunnlovsdag');
  });

  test('navigates between weeks', async ({ timeEntriesSteps, t }) => {
    await timeEntriesSteps.openWeekOf(TODAY);

    await timeEntriesSteps.goToNextWeek();
    await timeEntriesSteps.expectWeek(`${t('time.week')} 21`, '2026-05-18');

    await timeEntriesSteps.goToPreviousWeek();
    await timeEntriesSteps.goToPreviousWeek();
    await timeEntriesSteps.expectWeek(`${t('time.week')} 19`, '2026-05-04');
  });

  test('stays usable without holiday markers when the holiday API is down', async ({
    page,
    timeEntriesSteps,
  }) => {
    await simulateOutage(page, HOLIDAYS_URL_PATTERN);
    await timeEntriesSteps.openWeekOf(TODAY);

    await timeEntriesSteps.expectNoHoliday('2026-05-17');

    await timeEntriesSteps.logEntry({
      date: '2026-05-15',
      client: 'BYGGA AS',
      start: '08:00',
      end: '09:00',
    });
    await timeEntriesSteps.expectEntry('2026-05-15', '08:00–09:00', 'BYGGA AS', '1t 0m');
  });
});
