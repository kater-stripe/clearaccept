import { useRef, useState } from 'react';

export const useDebounceValue = <T>(value: T, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timeout = useRef<NodeJS.Timeout | null>(null);

  const setValue = (newValue: T) => {
    if (timeout.current) {
      clearTimeout(timeout.current);
    }

    timeout.current = setTimeout(() => {
      setDebouncedValue(newValue);
    }, delay);
  };

  return [debouncedValue, setValue] as const;
};
