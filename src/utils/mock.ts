/**
 * Local replacement for @demoeng/utils Mock, CountryCode, Language.
 * Uses @faker-js/faker — no private GitHub packages required.
 */

import { faker } from '@faker-js/faker';

export type CountryCode = string;
export type Language = 'en' | 'en-GB' | 'fr' | 'es' | 'de' | 'it' | 'ja' | 'zh';

type MockOptions = {
  language?: Language;
  country?: CountryCode;
  validForConnect?: boolean;
};

type WeightedItem<T> = { value: T; weight: number; description?: string };

export class Mock {
  private country: string;

  constructor({ country = 'US' }: MockOptions = {}) {
    this.country = country.toUpperCase();
  }

  companyNames() {
    const name = faker.company.name();
    return { name, name_kana: '' };
  }

  individualNames() {
    const first_name = faker.person.firstName();
    const last_name = faker.person.lastName();
    return {
      first_name,
      last_name,
      first_name_kana: '',
      last_name_kana: '',
      name: `${first_name} ${last_name}`,
    };
  }

  addresses() {
    const country = this.country.toLowerCase();
    const address = {
      line1: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state({ abbreviated: true }),
      postal_code: this.country === 'GB'
        ? faker.helpers.replaceSymbols('??# #??').toUpperCase()
        : faker.location.zipCode(),
      country,
    };
    return { address, address_kana: address };
  }

  phoneNumber() {
    return '+447400123456';
  }

  email({ individualNames, companyNames }: { individualNames?: { first_name: string; last_name: string }; companyNames?: { name: string } } = {}) {
    if (individualNames) {
      return faker.internet.email({
        firstName: individualNames.first_name,
        lastName: individualNames.last_name,
      });
    }
    if (companyNames?.name) {
      const slug = companyNames.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12);
      return `${slug}@example.com`;
    }
    return faker.internet.email();
  }

  taxId() {
    // UK NI format: AA000000A (test-mode friendly)
    if (this.country === 'GB') {
      const letters = 'ABCEGHJKLMNPRSTWXYZ';
      const a = letters[faker.number.int({ min: 0, max: letters.length - 1 })];
      const b = letters[faker.number.int({ min: 0, max: letters.length - 1 })];
      const digits = String(faker.number.int({ min: 100000, max: 999999 }));
      const suffix = ['A', 'B', 'C', 'D'][faker.number.int({ min: 0, max: 3 })];
      return `${a}${b}${digits}${suffix}`;
    }
    // US EIN format: XX-XXXXXXX
    return `${faker.number.int({ min: 10, max: 99 })}-${faker.number.int({ min: 1000000, max: 9999999 })}`;
  }

  integer({ min = 0, max = 100 }: { min?: number; max?: number } = {}) {
    return faker.number.int({ min, max });
  }

  dateOfBirth() {
    return { day: 1, month: 1, year: 1901 };
  }

  chooseFromWeightedArray<T>(items: WeightedItem<T>[]): T | undefined {
    const total = items.reduce((sum, item) => sum + item.weight, 0);
    let rand = faker.number.float({ min: 0, max: total });
    for (const item of items) {
      rand -= item.weight;
      if (rand <= 0) return item.value;
    }
    return items[items.length - 1]?.value;
  }

  uppercaseLetters({ length = 4 }: { length?: number } = {}) {
    return faker.string.alpha({ length, casing: 'upper' });
  }
}
