import { CurrencyCode } from '@/constants/currencyCodes';
import { useDemoConfig } from '@/context/DemoConfigContext';
import { formatPrice } from '@/utils/formatPrice';

type CurrencyPillProps = {
  currency: CurrencyCode;
  amount: number;
  size?: 'xs' | 'lg';
};

export const CurrencyPill = ({
  currency,
  amount,
  size = 'xs',
}: CurrencyPillProps) => {
  const { language } = useDemoConfig();

  return (
    <p className={`flex items-center ${size === 'xs' ? 'gap-x-1' : 'gap-x-2'}`}>
      <span
        className={`p-1 rounded-md bg-brand-primary text-brand-primary-contrasting-text ${
          size === 'xs' ? 'text-xs' : 'text-lg'
        }`}
      >
        {currency.toUpperCase()}
      </span>
      <span className={`${size === 'xs' ? 'text-md' : 'text-xl'}`}>
        {formatPrice(amount ?? 0, language, currency as CurrencyCode)}
      </span>
    </p>
  );
};
