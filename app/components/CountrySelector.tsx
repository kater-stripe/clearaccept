import * as SelectPrimitive from '@radix-ui/react-select';
import {Countries, CountryType} from '@/types/settings';
import React, {useState} from 'react';
import {useTranslation} from 'react-i18next';
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  Label,
} from '@headlessui/react';
import {CheckCircleIcon, ChevronDownIcon} from '@heroicons/react/24/solid';

type CountryProps = {
  onChange: (...event: any[]) => void;
  value: CountryType;
  disabled?: boolean | undefined;
  name: 'country';
  className?: string;
};

type CountrySelectorProps = CountryProps & {
  ref?: React.Ref<React.ElementRef<typeof SelectPrimitive.Root>>;
};

const CountrySelector = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  CountrySelectorProps
>(({onChange, value, disabled, name, className}, ref) => {
  const {t} = useTranslation();

  const [query, setQuery] = useState('');

  const filteredCountries =
    query === ''
      ? Countries
      : Countries.filter((country) => {
          return country.label.toLowerCase().includes(query.toLowerCase());
        });

  return (
    <Combobox
      as="div"
      value={value}
      onChange={onChange}
      disabled={disabled}
      name={name}
    >
      <div className="relative mt-2">
        <ComboboxInput
          className="w-full rounded-md border border-gray-300 bg-white py-[6px] pl-3 focus:border-primary focus:ring-2 focus:ring-primary sm:text-sm/6"
          onChange={(event) => setQuery(event.target.value)}
          onBlur={() => setQuery('')}
          displayValue={(country: any) => {
            return t(
              Countries.find((cn) => cn.country === country)?.label || ''
            );
          }}
        />
        <ComboboxButton className="absolute inset-y-0 right-0 flex items-center rounded-r-md focus:outline-none">
          <ChevronDownIcon
            aria-hidden="true"
            className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4"
          />
        </ComboboxButton>

        {filteredCountries.length > 0 && (
          <ComboboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
            {filteredCountries.map((country) => (
              <ComboboxOption
                key={country.country}
                value={country.country}
                className="group relative cursor-default select-none py-2 pl-3 pr-9 text-gray-900 data-[focus]:bg-indigo-600 data-[focus]:text-white"
              >
                <span className="block truncate group-data-[selected]:font-semibold">
                  {t(country.label)} - {country.country}
                </span>

                <span className="absolute inset-y-0 right-0 hidden items-center pr-4 text-indigo-600 group-data-[selected]:flex group-data-[focus]:text-white">
                  <CheckCircleIcon className="h-5 w-5" aria-hidden="true" />
                </span>
              </ComboboxOption>
            ))}
          </ComboboxOptions>
        )}
      </div>
    </Combobox>
  );
});

CountrySelector.displayName = 'CountrySelector';

export default CountrySelector;
