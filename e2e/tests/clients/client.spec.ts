import { test, expect } from '../../fixtures/fixture';
import { BRREG_DOMAIN, BRREG_URL_PATTERN } from '../../data/external-urls';
import { Role } from '../../types/user.types';
import { COMPANIES, UNKNOWN_ORG_NUMBER } from '../../data/mocks/companies';
import { simulateOutage } from '../../utils/external-api.utils';

const COMPANY = COMPANIES.fjord;

test.use({ role: Role.ADMIN });

test.describe('Create a client via the organization-number lookup', () => {
  test.beforeEach(async ({ clientsSteps }) => {
    await clientsSteps.openNewClientForm();
  });

  test('lookup pre-fills the form and the saved client appears in the list', async ({
    clientsSteps,
    t,
  }) => {
    await clientsSteps.lookUpAndExpectRegisterCall(COMPANY.orgNumber);
    await clientsSteps.expectFormPrefilledWith(COMPANY);

    await clientsSteps.saveClient();
    await clientsSteps.expectClientInList(
      COMPANY.name,
      COMPANY.orgNumber,
      COMPANY.poststed,
      t('status.onboarding'),
    );
  });

  test('when the register is unreachable the user can still enter details manually', async ({
    page,
    clientsSteps,
    t,
  }) => {
    await simulateOutage(page, BRREG_URL_PATTERN);

    await clientsSteps.lookUp(COMPANIES.nordlys.orgNumber);

    await clientsSteps.expectLookupMessage(t('clientForm.lookupFailed'));
    await clientsSteps.expectFormNotPrefilled();

    await clientsSteps.fillManually({ name: 'MANUELL KLIENT AS' });
    await clientsSteps.saveClient();
    await clientsSteps.expectClientInList('MANUELL KLIENT AS');
  });

  test('rejects an organization number with a bad control digit without calling the register', async ({
    page,
    clientsSteps,
  }) => {
    let lookups = 0;
    page.on('request', (r) => {
      if (r.url().includes(BRREG_DOMAIN)) {
        lookups++;
      }
    });

    await clientsSteps.lookUp('912345679'); // valid would be ...688/696/…

    await clientsSteps.expectInvalidOrgNumberError();
    await clientsSteps.expectFormNotPrefilled();
    expect(lookups).toBe(0);
  });

  test('an org number unknown to the register leaves the form empty for manual entry', async ({
    clientsSteps,
  }) => {
    await clientsSteps.lookUp(UNKNOWN_ORG_NUMBER);

    await clientsSteps.expectLookupMessage();
    await clientsSteps.expectFormNotPrefilled();
  });
});
