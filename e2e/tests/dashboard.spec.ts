import { test } from '../fixtures/fixture';
import { Role } from '../types/user.types';
import { FX_URL_PATTERN } from '../data/external-urls';
import { MOCK_EUR_NOK, simulateOutage } from '../utils/external-api.utils';
import { formatNumber } from '../utils/i18n.utils';
import type { Language } from '../types/language.types';

// With today pinned to Wed 13 May 2026, the seeded week (Mon 11 – Sun 17 May) holds
// 870 minutes = 14.5 h, of which 14 350 kr billable at the clients' hourly rates.
const TODAY = '2026-05-13';
const BILLABLE_NOK = 14_350;

const nok = (language: Language): string => formatNumber(BILLABLE_NOK, language);
const eur = (rate: number, language: Language): string =>
  formatNumber(BILLABLE_NOK / rate, language, { minDigits: 2, maxDigits: 2 });

test.use({ role: Role.ACCOUNTANT });

test.describe('Dashboard', () => {
  test('shows client counts and this week’s hours and billable amount', async ({
    dashboardSteps,
    language,
  }) => {
    await dashboardSteps.openDashboard(TODAY);

    await dashboardSteps.expectStats({
      activeClients: '18',
      totalClients: '27',
      hoursThisWeek: formatNumber(14.5, language, { maxDigits: 1 }),
      billableNok: nok(language),
      billableEur: eur(MOCK_EUR_NOK, language),
    });
  });

  test('falls back to the offline EUR rate when Norges Bank is unreachable', async ({
    page,
    dashboardSteps,
    language,
  }) => {
    await simulateOutage(page, FX_URL_PATTERN);

    await dashboardSteps.openDashboard(TODAY);

    await dashboardSteps.expectStats({
      billableNok: nok(language),
      billableEur: eur(11.5, language),
    });
  });
});
