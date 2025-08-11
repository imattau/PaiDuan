"use client";

import * as React from "react";

export type AccordionItem = {
  title: string;
  content: React.ReactNode;
};

export interface AccordionProps {
  items: AccordionItem[];
  /**
   * Index of the item to open initially. Pass `null` to start with all closed.
   */
  initialOpenIndex?: number | null;
}

export function Accordion({ items, initialOpenIndex = null }: AccordionProps) {
  const [openIndex, setOpenIndex] = React.useState<number | null>(
    initialOpenIndex ?? null,
  );

  React.useEffect(() => {
    setOpenIndex(initialOpenIndex ?? null);
  }, [initialOpenIndex]);

  const toggle = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <div className="space-y-2">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div key={index} className="border rounded">
            <button
              type="button"
              className="w-full flex items-center justify-between px-4 py-2 text-left font-medium"
              aria-expanded={isOpen}
              onClick={() => toggle(index)}
            >
              {item.title}
              <span className="ml-2">{isOpen ? "-" : "+"}</span>
            </button>
            {isOpen && <div className="px-4 pb-4">{item.content}</div>}
          </div>
        );
      })}
    </div>
  );
}

export default Accordion;

