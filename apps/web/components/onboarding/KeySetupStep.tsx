'use client';

import * as nip19 from 'nostr-tools/nip19';
import { generateSecretKey } from 'nostr-tools/pure';
import { bytesToHex } from '@noble/hashes/utils';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@paiduan/ui';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

function privHexFrom(input: string): string {
  const s = input.trim();
  if (/^nsec1/i.test(s)) {
    const { type, data } = nip19.decode(s);
    if (type !== 'nsec') throw new Error('Invalid nsec');
    return typeof data === 'string' ? data.toLowerCase() : bytesToHex(data);
  }
  if (/^[0-9a-f]{64}$/i.test(s)) return s.toLowerCase();
  throw new Error('Unsupported private key format');
}

export function KeySetupStep({ onComplete }: { onComplete: () => void }) {
  const { signInWithLocal, signInWithNip07, signInWithNip46 } = useAuth();

  const uriSchema = z.object({
    uri: z
      .string()
      .min(1, 'Remote signer URI is required')
      .url('Invalid URI')
      .refine((val) => val.startsWith('nostrconnect:'), {
        message: 'Must start with nostrconnect:',
      }),
  });
  type UriForm = z.infer<typeof uriSchema>;
  const {
    register: registerUri,
    handleSubmit: handleSubmitUri,
    formState: { errors: uriErrors, isValid: uriValid },
  } = useForm<UriForm>({
    resolver: zodResolver(uriSchema),
    mode: 'onChange',
    defaultValues: { uri: '' },
  });

  const privSchema = z.object({
    privkey: z
      .string()
      .min(1, 'Private key is required')
      .refine((val) => {
        try {
          privHexFrom(val);
          return true;
        } catch {
          return false;
        }
      }, 'Invalid nsec or hex private key')
      .transform((val) => privHexFrom(val)),
  });
  type PrivForm = z.infer<typeof privSchema>;
  const {
    register: registerPriv,
    handleSubmit: handleSubmitPriv,
    formState: { errors: privErrors, isValid: privValid },
  } = useForm<PrivForm>({
    resolver: zodResolver(privSchema),
    mode: 'onChange',
    defaultValues: { privkey: '' },
  });

  function saveLocalKey(priv: string) {
    try {
      signInWithLocal(priv);
      onComplete();
    } catch (e: any) {
      alert(e.message || 'Failed to save key');
    }
  }

  const onImport = handleSubmitPriv(({ privkey }) => {
    saveLocalKey(privkey);
  });

  const generateKey = () => {
    const priv = bytesToHex(generateSecretKey());
    saveLocalKey(priv);
  };

  const onConnectRemote = handleSubmitUri(async ({ uri }) => {
    try {
      await signInWithNip46(uri);
      onComplete();
    } catch (e: any) {
      alert(e.message || 'Failed to connect');
    }
  });

  const connectExtension = () => {
    try {
      signInWithNip07();
      onComplete();
    } catch (e: any) {
      alert(e.message || 'No NIP-07 extension found');
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full max-w-xs">
      <Button
        className="btn-primary w-full"
        onClick={connectExtension}
        disabled={!(globalThis as any).nostr}
      >
        Continue with Nostr Extension
      </Button>

      <form onSubmit={onConnectRemote} className="space-y-2 rounded-xl border p-4">
        <label className="text-sm font-medium">Remote signer (NIP‑46)</label>
        <input {...registerUri('uri')} placeholder="nostrconnect:..." className="input w-full" />
        {uriErrors.uri && <span className="text-sm text-red-500">{uriErrors.uri.message}</span>}
        <Button type="submit" className="btn-outline w-full" disabled={!uriValid}>
          Connect remote signer
        </Button>
      </form>

      <form onSubmit={onImport} className="space-y-2 rounded-xl border p-4">
        <label className="text-sm font-medium">Import nsec / hex</label>
        <input {...registerPriv('privkey')} placeholder="nsec1..." className="input w-full" />
        {privErrors.privkey && (
          <span className="text-sm text-red-500">{privErrors.privkey.message}</span>
        )}
        <Button type="submit" className="btn-outline w-full" disabled={!privValid}>
          Import key
        </Button>
      </form>

      <Button className="btn-outline w-full" type="button" onClick={generateKey}>
        Generate new key
      </Button>
    </div>
  );
}

export default KeySetupStep;
