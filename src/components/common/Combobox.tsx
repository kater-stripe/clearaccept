'use client';

import {
  Combobox as HeadlessCombobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  ComboboxProps as HeadlessComboboxProps,
  Label,
} from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { useState } from 'react';

type Option = {
  id: string;
  name: string;
};

type ComboboxProps = HeadlessComboboxProps<Option | null, false> & {
  options: Option[];
  label?: string;
  required?: boolean;
};

export const Combobox = ({
  options,
  onChange,
  value,
  label,
  required,
  ...props
}: ComboboxProps) => {
  const [query, setQuery] = useState('');

  const filteredOptions = options.filter((option) =>
    option.name.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <HeadlessCombobox
      as='div'
      value={value}
      onChange={(val) => {
        setQuery('');
        onChange?.(val);
      }}
      {...props}
    >
      {label && (
        <Label className='block text-sm/6 font-medium text-gray-900 flex items-center gap-x-1'>
          {label}
          {required && <span className='text-red-500'>*</span>}
        </Label>
      )}
      <div className='relative mt-2'>
        <ComboboxInput
          className='block w-full rounded-md bg-white py-1.5 pl-3 pr-12 text-base text-gray-900 outline-solid outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-solid focus:ring-2 focus:outline-2 focus:-outline-offset-2 focus:ring-brand-primary focus:border-brand-primary sm:text-sm/6'
          onChange={(event) => setQuery(event.target.value)}
          onBlur={() => setQuery('')}
          displayValue={(val) => (val as Option)?.name}
        />
        <ComboboxButton className='absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-hidden'>
          <ChevronDownIcon
            className='size-5 text-gray-400'
            aria-hidden='true'
          />
        </ComboboxButton>

        <ComboboxOptions
          transition
          className='absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-hidden data-closed:data-leave:opacity-0 data-leave:transition data-leave:duration-100 data-leave:ease-in sm:text-sm'
        >
          {filteredOptions.map((option) => (
            <ComboboxOption
              key={option.id}
              value={option}
              className='cursor-default select-none px-3 py-2 text-gray-900 data-focus:bg-brand-primary data-focus:text-white data-focus:outline-hidden'
            >
              <span className='block truncate'>{option.name}</span>
            </ComboboxOption>
          ))}
        </ComboboxOptions>
      </div>
    </HeadlessCombobox>
  );
};
