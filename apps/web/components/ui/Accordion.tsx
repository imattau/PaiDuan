import React from 'react';
import { Disclosure } from '@headlessui/react';
import { ChevronDown } from 'lucide-react';

export interface AccordionItem {
  title: string;
  content: React.ReactNode;
}

export function Accordion({ items }: { items: AccordionItem[] }) {
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <Disclosure key={index}>
          {() => (
            <>
              <Disclosure.Button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="flex w-full items-center justify-between py-2 text-left"
              >
                <span>{item.title}</span>
                <ChevronDown
                  className={`h-5 w-5 transition-transform ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </Disclosure.Button>
              <Disclosure.Panel
                static
                className={openIndex === index ? 'pt-2' : 'hidden'}
              >
                {item.content}
              </Disclosure.Panel>
            </>
          )}
        </Disclosure>
      ))}
    </div>
  );
}

export default Accordion;

