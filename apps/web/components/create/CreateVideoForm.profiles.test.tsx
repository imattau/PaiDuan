/* @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import CreateVideoForm from './CreateVideoForm';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../../lib/queryClient';
import { NextIntlClientProvider } from 'next-intl';
import common from '../../locales/en/common.json';
import create from '../../locales/en/create.json';

const following = ['pk1', 'pk2'];
const subscribeMany = vi.hoisted(() => vi.fn(() => ({ close: vi.fn() })));

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ state: { status: 'signedOut' } }),
}));
vi.mock('../../hooks/useFollowing', () => ({ default: () => ({ following }) }));
vi.mock('@/lib/relayPool', () => ({ default: { subscribeMany } }));
vi.mock('@/hooks/useProfiles', () => {
  let called = false;
  return {
    useProfiles: (pks: string[]) => {
      if (!called) {
        pks.forEach(() => subscribeMany([], [], {} as any));
        called = true;
      }
      return new Map([
        ['pk1', { lud16: 'alice@test' }],
        ['pk2', { lud16: 'bob@test' }],
      ]);
    },
  };
});
vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: vi.fn() }),
}));

(globalThis as any).React = React;
const messages = { common, create };
const renderForm = (root: any) => {
  root.render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <QueryClientProvider client={queryClient}>
        <CreateVideoForm />
      </QueryClientProvider>
    </NextIntlClientProvider>,
  );
};

describe('CreateVideoForm profiles', () => {
  beforeEach(() => {
    queryClient.clear();
    subscribeMany.mockClear();
  });

  it('subscribes once and populates lnaddr datalist', async () => {
    const container = document.createElement('div');
    const root = createRoot(container);
    await act(async () => {
      renderForm(root);
    });
    await Promise.resolve();
    await Promise.resolve();
    const opts = container.querySelectorAll('#lnaddr-options option');
    const values = Array.from(opts).map((o) => o.getAttribute('value'));
    expect(values).toEqual(expect.arrayContaining(['alice@test', 'bob@test']));
  });
});
