export interface MockCompany {
  orgNumber: string;
  name: string;
  address: string;
  postnummer: string;
  poststed: string;
}

// Org numbers carry a valid mod-11 control digit (the form validates it) and
// are not used by the seed data, so a created client never collides with one.
export const COMPANIES = {
  fjord: {
    orgNumber: '912345688',
    name: 'FJORD TESTREGNSKAP AS',
    address: 'Bryggen 12',
    postnummer: '5003',
    poststed: 'Bergen',
  },
  nordlys: {
    orgNumber: '912345696',
    name: 'NORDLYS TESTKONSULT AS',
    address: 'Storgata 1',
    postnummer: '9008',
    poststed: 'Tromsø',
  },
} satisfies Record<string, MockCompany>;

/** Valid mod-11 org number that the mocked register answers with 404. */
export const UNKNOWN_ORG_NUMBER = '912345718';
