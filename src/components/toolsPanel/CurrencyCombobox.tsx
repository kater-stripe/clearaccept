'use client';

import { CurrencyCode, CURRENCY_CODES } from '@/constants/currencyCodes';
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  Label,
} from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { useState } from 'react';

type CurrencyComboboxProps = {
  selectedCurrencyCode: string;
  setSelectedCurrencyCode: (currencyCode: CurrencyCode) => void;
};

export const CurrencyCombobox = ({
  selectedCurrencyCode,
  setSelectedCurrencyCode,
}: CurrencyComboboxProps) => {
  const [query, setQuery] = useState('');

  const filteredCurrencies = query
    ? CURRENCY_CODES.filter((currency) =>
        currency.toLowerCase().includes(query.toLowerCase()),
      )
    : CURRENCY_CODES;

  return (
    <Combobox
      as='div'
      value={selectedCurrencyCode}
      onChange={(currencyCode) => {
        if (!currencyCode) {
          return;
        }

        setQuery('');
        setSelectedCurrencyCode(currencyCode as CurrencyCode);
      }}
    >
      <Label className='block text-sm font-medium leading-6 text-gray-700'>
        Currency
      </Label>
      <div className='relative mt-2'>
        <ComboboxInput
          className='w-full p-2 border border-gray-300 rounded-md text-gray-700 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
          onChange={(event) => setQuery(event.target.value)}
          onBlur={() => setQuery('')}
          displayValue={(currency) => (currency as string).toUpperCase()}
        />
        <ComboboxButton className='absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-hidden'>
          <ChevronUpDownIcon
            className='h-5 w-5 text-gray-400'
            aria-hidden='true'
          />
        </ComboboxButton>

        {filteredCurrencies.length > 0 && (
          <ComboboxOptions className='absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-hidden sm:text-sm'>
            {filteredCurrencies.map((currency) => (
              <ComboboxOption
                key={currency}
                value={currency}
                className='group relative cursor-default select-none py-2 pl-3 pr-9 text-gray-900 data-focus:bg-indigo-600 data-focus:text-white'
              >
                <span className='block truncate group-data-selected:font-semibold'>
                  {currency.toUpperCase()}
                </span>

                <span className='absolute inset-y-0 right-0 hidden items-center pr-4 text-indigo-600 group-data-selected:flex group-data-focus:text-white'>
                  <CheckIcon className='h-5 w-5' aria-hidden='true' />
                </span>
              </ComboboxOption>
            ))}
          </ComboboxOptions>
        )}
      </div>
    </Combobox>
  );
};
