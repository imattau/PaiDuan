import React from 'react';
import clsx from 'clsx';

export const cardStyle =
  'bg-[var(--background-secondary)] rounded-[10px] border border-border-primary shadow-card';

export function Card({
  title,
  desc,
  children,
  className,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={clsx(cardStyle, 'p-6 space-y-4', className)}>
      <header>
        <h2 className="text-lg font-semibold">{title}</h2>
        {desc && <p className="text-sm text-muted">{desc}</p>}
      </header>
      {children}
    </section>
  );
}

export default Card;
