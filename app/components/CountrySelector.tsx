import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import * as SelectPrimitive from '@radix-ui/react-select';
import {Countries, CountryType} from '@/types/settings';
import React from 'react';
import {useTranslation} from 'react-i18next';

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
  const countryName = (countryKey: CountryType) =>
    Countries.find(({country}) => country === countryKey)?.label;

  return (
    <Select
      value={value}
      onValueChange={onChange}
      disabled={disabled}
      name={name}
    >
      <SelectTrigger className={className} ref={ref}>
        <SelectValue placeholder={t('auth.signup.country')}>
          {t(countryName(value)!)}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className={className}>
        {Countries.map((country, index) => (
          <SelectItem value={country.country} key={index}>
            {t(country.label)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
});

CountrySelector.displayName = 'CountrySelector';

export default CountrySelector;
