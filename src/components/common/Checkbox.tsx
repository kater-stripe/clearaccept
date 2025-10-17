'use client';

import { generateHtmlIdFromLabel } from '@/utils/generateHtmlIdFromLabel';
import type { ComponentProps } from 'react';

type CheckboxProps = Omit<ComponentProps<'input'>, 'onChange'> & {
  label: string;
  tooltip?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
};

export const Checkbox = ({
  label,
  checked,
  onChange,
  disabled,
  ...rest
}: CheckboxProps) => {
  return (
    <div className='flex items-center'>
      <input
        {...rest}
        id={generateHtmlIdFromLabel(label)}
        type='checkbox'
        checked={checked}
        disabled={disabled}
        onChange={(e) => {
          if (!onChange) {
            return;
          }

          onChange(e.target.checked);
        }}
        className={`h-4 w-4 text-brand-primary focus:ring-brand-primary border-gray-300 rounded-sm ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      />
      <label
        htmlFor={generateHtmlIdFromLabel(label)}
        className='ml-2 block text-sm text-gray-900 flex items-center gap-x-1'
      >
        {label}
      </label>
    </div>
  );
};
