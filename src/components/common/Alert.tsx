import { type ComponentProps } from 'react';

type AlertProps = ComponentProps<'div'>;

export const Alert = ({ children, ...rest }: AlertProps) => {
  return (
    <div
      {...rest}
      className='w-full bg-red-50 border border-red-200 text-red-600 p-4 rounded-md'
    >
      {children}
    </div>
  );
};
