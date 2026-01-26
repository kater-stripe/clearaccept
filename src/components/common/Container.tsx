import { type ComponentProps } from 'react';

type ContainerProps = ComponentProps<'div'>;

export const Container = ({
  children,
  className,
  ...props
}: ContainerProps) => {
  return (
    <div
      className={`mx-auto w-full min-h-screen max-w-7xl py-8 px-4 sm:px-6 lg:px-8 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
