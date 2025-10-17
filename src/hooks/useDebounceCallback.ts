import { useRef } from 'react';

export const useDebounceCallback = <T extends (...args: any) => any>(
  callback: T,
  delay: number,
) => {
  const existingTimeout = useRef<NodeJS.Timeout | null>(null);

  const debounceCallback = (...args: Parameters<T>) => {
    if (existingTimeout.current) {
      clearTimeout(existingTimeout.current);
    }

    existingTimeout.current = setTimeout(() => {
      callback(...args);
    }, delay);
  };

  debounceCallback.cancel = () => {
    if (existingTimeout.current) {
      clearTimeout(existingTimeout.current);
    }
  };

  return debounceCallback;
};
