/* @vitest-environment jsdom */
import React, { useState } from 'react';
import { describe, it, expect } from 'vitest';
import { createRoot } from 'react-dom/client';
import { useForm } from 'react-hook-form';
import { act } from 'react';
import MetadataForm from './MetadataForm';

(globalThis as any).React = React;

describe('MetadataForm', () => {
  const t = (k: string) => k;
  const Wrapper = () => {
    const [custom, setCustom] = useState('');
    const [nsfw, setNsfw] = useState(false);
    const { register, handleSubmit, formState: { errors } } = useForm<any>({
      defaultValues: { caption: '', topics: '', license: 'other', lightningAddress: '', zapSplits: [] },
    });
    return (
      <MetadataForm
        register={register}
        errors={errors}
        license="other"
        customLicense={custom}
        setCustomLicense={setCustom}
        nsfw={nsfw}
        setNsfw={setNsfw}
        showZapSelect={false}
        zapOptions={[]}
        selectedZapOption=""
        setLightningAddress={() => {}}
        zapFields={[]}
        addSplit={() => {}}
        removeSplit={() => {}}
        totalPct={0}
        lnaddrOptions={[]}
        t={t}
        tCommon={t}
        outBlob={new Blob()}
        posting={false}
        isValid={true}
        handleSubmit={handleSubmit}
        onSubmit={() => {}}
      />
    );
  };

  it('shows custom license input when selecting other', () => {
    const container = document.createElement('div');
    const root = createRoot(container);
    act(() => {
      root.render(<Wrapper />);
    });
    expect(container.querySelector('[data-testid="custom-license-input"]')).not.toBeNull();
  });
});
