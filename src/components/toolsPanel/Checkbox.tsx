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
  tooltip,
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
        className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      />
      <label
        htmlFor={generateHtmlIdFromLabel(label)}
        className='ml-2 block text-sm text-gray-900 flex items-center gap-x-1'
      >
        {label}
        {tooltip && (
          <div className='group flex relative'>
            <img
              className='h-4 w-auto'
              src={'/img/icon/info-circle.svg'}
              alt='Info'
            />
            <span className='max-w-32 text-xs text-wrap invisible group-hover:visible opacity-0 border group-hover:opacity-100 transition-opacity duration-300 bg-white text-black rounded-md absolute bottom-full left-1/2 -translate-x-1/2 mb-2 py-1 px-2 w-max'>
              {tooltip}
            </span>
          </div>
        )}
      </label>
    </div>
  );
};
