import { useEffect } from 'react';

export default function useFocusTrap(active: boolean, ref: React.RefObject<HTMLElement>) {
  useEffect(() => {
    if (!active || !ref.current) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const node = ref.current;
    const focusable = node.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          (last || first).focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          (first || last).focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    first?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [active, ref]);
}

