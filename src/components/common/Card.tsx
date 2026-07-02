import type { ComponentProps } from 'react';

type CardProps = ComponentProps<'div'> & {
  accent?: string; // left-border color, e.g. '#77B32A'
};

export const Card = ({ children, className, accent, style, ...rest }: CardProps) => {
  return (
    <div
      className={className}
      style={{
        background: '#fff',
        borderRadius: 6,
        boxShadow: '0 2px 8px rgba(0,0,0,.08)',
        padding: '22px 24px',
        ...(accent ? { borderLeft: `4px solid ${accent}` } : {}),
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
};
