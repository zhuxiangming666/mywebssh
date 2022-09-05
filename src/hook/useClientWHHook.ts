import { debounce } from '@/utils';
import { useEffect, useRef, useState } from 'react';

export const useClientWHHook = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [szie, Szie] = useState<{
    w: number;
    h: number;
  }>({ w: 0, h: 0 });
  useEffect(() => {
    Szie({
      w: containerRef.current?.clientWidth || 0,
      h: containerRef.current?.clientHeight || 0,
    });
    const fn = debounce(() => {
      Szie({
        w: containerRef.current?.clientWidth || 0,
        h: containerRef.current?.clientHeight || 0,
      });
    });
    window.addEventListener('resize', fn);
    return () => {
      window.removeEventListener('resize', fn);
    };
  }, []);

  return { containerRef, szie };
};
