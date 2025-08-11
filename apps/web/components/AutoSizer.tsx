'use client';

import { useState, useRef, useLayoutEffect } from 'react';

interface Size {
  width: number;
  height: number;
}

interface AutoSizerProps {
  className?: string;
  children: (size: Size) => React.ReactNode;
}

export default function AutoSizer({ className, children }: AutoSizerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [{ width, height }, setSize] = useState<Size>(() => ({
    width: typeof window === 'undefined' ? 0 : window.innerWidth,
    height: typeof window === 'undefined' ? 0 : window.innerHeight,
  }));

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      setSize({
        width: rect.width || window.innerWidth,
        height: rect.height || window.innerHeight,
      });
    };

    measure();

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(measure);
      observer.observe(el);
      return () => observer.disconnect();
    } else {
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }
  }, []);

  return (
    <div ref={ref} className={className}>
      {width > 0 && height > 0 ? children({ width, height }) : null}
    </div>
  );
}
