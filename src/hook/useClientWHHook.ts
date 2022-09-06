import { debounce } from '@/utils';
import { useEffect, useRef, useState } from 'react';

export const useClientWHHook = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, Size] = useState<{
    w: number;
    h: number;
  }>({ w: 0, h: 0 });
  useEffect(() => {
    Size({
      w: containerRef.current?.clientWidth || 0,
      h: containerRef.current?.clientHeight || 0,
    });
    const fn = debounce(() => {
      Size({
        w: containerRef.current?.clientWidth || 0,
        h: containerRef.current?.clientHeight || 0,
      });
    });
    window.addEventListener('resize', fn);
    return () => {
      window.removeEventListener('resize', fn);
    };
  }, []);

  return { containerRef, size };
};
