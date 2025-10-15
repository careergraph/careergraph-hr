import { useCallback, useEffect, useState } from 'react';
import { useDebounce } from '@/hooks/use-debound';

type Options = {
  delay?: number;
  onDebouncedChange?: (value: string) => void;
};

export const useDebouncedSearch = (
  initialValue = '',
  options?: Options,
) => {
  const [value, setValue] = useState<string>(initialValue);
  const debouncedValue = useDebounce(value, options?.delay ?? 500);

  useEffect(() => {
    if (options?.onDebouncedChange) {
      options.onDebouncedChange(debouncedValue);
    }
  }, [debouncedValue, options]);

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement> | string) => {
      const next = typeof e === 'string' ? e : e.target.value;
      setValue(next);
    },
    [],
  );

  const reset = useCallback(() => setValue(''), []);

  return {
    value,
    setValue,
    onChange,
    debouncedValue,
    reset,
  } as const;
};
