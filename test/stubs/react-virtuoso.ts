export type ListRange = { startIndex: number; endIndex: number };
export type VirtuosoHandle = { scrollToIndex?: (opts: { index: number; align?: 'start' | 'center' | 'end'; }) => void };

interface VirtuosoProps<T> {
  data?: T[];
  totalCount?: number;
  itemContent?: (index: number, item: T) => React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  scrollerRef?: (ref: HTMLElement | null) => void;
  endReached?: () => void;
  rangeChanged?: (range: ListRange) => void;
}

export function Virtuoso<T>({
  data = [],
  totalCount = data.length,
  itemContent,
  style,
  className,
  scrollerRef,
}: VirtuosoProps<T>) {
  const React = (globalThis as any).React;
  const items = data.length ? data : Array.from({ length: totalCount }).map(() => undefined as T);
  return React.createElement(
    'div',
    { style, className, ref: scrollerRef as any },
    itemContent &&
      items.map((item, i) =>
        React.createElement('div', { key: i }, itemContent(i, item)),
      ),
  );
}

export default Virtuoso;
