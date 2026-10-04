import type { BrowserContext, Page, Route } from '@playwright/test';
import { BRREG_URL_PATTERN, FX_URL_PATTERN, HOLIDAYS_URL_PATTERN } from '../data/external-urls';
import { COMPANIES, type MockCompany } from '../data/mocks/companies';

// Deterministic stand-ins for the three public APIs the app calls. The suite
// must never depend on them being reachable, so every request to them is
// answered locally, and anything else off-origin (e.g. Google Fonts) is
// aborted so a slow CDN can't stall `page.goto`'s load event.

/** Fixed EUR/NOK rate; deliberately different from the app's 11.5 offline fallback. */
export const MOCK_EUR_NOK = 11.75;

function brregEntity(company: MockCompany) {
  return {
    organisasjonsnummer: company.orgNumber,
    navn: company.name,
    forretningsadresse: {
      adresse: [company.address],
      postnummer: company.postnummer,
      poststed: company.poststed,
      land: 'Norge',
    },
  };
}

async function fulfillBrreg(route: Route): Promise<void> {
  const orgNumber = new URL(route.request().url()).pathname.split('/').at(-1);
  const company = Object.values(COMPANIES).find((c) => c.orgNumber === orgNumber);
  if (!company) {
    await route.fulfill({ status: 404, json: { status: 404, error: 'Not Found' } });
    return;
  }
  await route.fulfill({ json: brregEntity(company) });
}

/** A small, fixed subset of Norwegian public holidays for any requested year. */
function holidaysFor(year: number) {
  return [
    { date: `${year}-01-01`, localName: 'Første nyttårsdag', name: "New Year's Day" },
    { date: `${year}-05-01`, localName: 'Første mai', name: 'Labour Day' },
    { date: `${year}-05-17`, localName: 'Grunnlovsdag', name: 'Constitution Day' },
    { date: `${year}-12-25`, localName: 'Første juledag', name: 'Christmas Day' },
  ];
}

async function fulfillHolidays(route: Route): Promise<void> {
  const year = Number(new URL(route.request().url()).pathname.split('/').at(-2));
  await route.fulfill({ json: holidaysFor(year) });
}

async function fulfillFx(route: Route): Promise<void> {
  await route.fulfill({
    json: {
      data: {
        dataSets: [{ series: { '0:0:0:0': { observations: { '0': [String(MOCK_EUR_NOK)] } } } }],
        structure: {
          dimensions: { observation: [{ id: 'TIME_PERIOD', values: [{ id: '2026-05-12' }] }] },
        },
      },
    },
  });
}

export async function mockExternalApis(context: BrowserContext, appOrigin: string): Promise<void> {
  // Playwright runs the most recently registered matching route first, so the
  // catch-all goes in first and the mocks below override it for their own paths.
  // Anything off-origin they don't cover, even on the same hosts, stays blocked.
  await context.route(
    (url) => url.origin !== appOrigin,
    (route) => route.abort('blockedbyclient'),
  );

  await context.route(BRREG_URL_PATTERN, fulfillBrreg);
  await context.route(HOLIDAYS_URL_PATTERN, fulfillHolidays);
  await context.route(FX_URL_PATTERN, fulfillFx);
}

/** Makes one external API unreachable for this page only (page routes win over context mocks). */
export async function simulateOutage(page: Page, urlPattern: string): Promise<void> {
  await page.route(urlPattern, (route) => route.abort('connectionrefused'));
}
