/* @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import ZapSplitFields from './ZapSplitFields';

(globalThis as any).React = React;

describe('ZapSplitFields', () => {
  const t = (k: string) => k;
  it('calls add and remove handlers', () => {
    const zapFields = [{ id: '1' }, { id: '2' }] as any;
    const register = vi.fn();
    const removeSplit = vi.fn();
    const addSplit = vi.fn();
    const container = document.createElement('div');
    const root = createRoot(container);
    act(() => {
      root.render(
        <ZapSplitFields
          zapFields={zapFields}
          register={register as any}
          removeSplit={removeSplit}
          addSplit={addSplit}
          totalPct={0}
          canAddMore={true}
          lnaddrOptions={[]}
          t={t}
        />,
      );
    });
    container.querySelector('button')?.click();
    expect(removeSplit).toHaveBeenCalled();
    container.querySelectorAll('button')[zapFields.length]?.click();
    expect(addSplit).toHaveBeenCalled();
  });

  it('deduplicates lnaddrOptions', () => {
    const zapFields = [] as any;
    const register = vi.fn();
    const container = document.createElement('div');
    const root = createRoot(container);
    act(() => {
      root.render(
        <ZapSplitFields
          zapFields={zapFields}
          register={register as any}
          removeSplit={vi.fn()}
          addSplit={vi.fn()}
          totalPct={0}
          canAddMore={false}
          lnaddrOptions={['a@example.com', 'b@example.com', 'a@example.com']}
          t={t}
        />,
      );
    });
    const options = container.querySelectorAll('#lnaddr-options option');
    expect(options.length).toBe(2);
  });
});
