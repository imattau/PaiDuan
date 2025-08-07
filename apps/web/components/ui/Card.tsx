import React from 'react';

export function Card({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border bg-white/5 dark:bg-neutral-900 p-6 shadow-sm space-y-4">
      <header>
        <h2 className="text-lg font-semibold">{title}</h2>
        {desc && <p className="text-sm text-muted-foreground">{desc}</p>}
      </header>
      {children}
    </section>
  );
}

export default Card;
