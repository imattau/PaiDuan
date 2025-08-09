import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import pool from '@/lib/relayPool';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { getRelays } from '@/lib/nostr';

interface Props {
  targetId: string;
  targetKind: 'video' | 'comment';
  open: boolean;
  onClose: () => void;
}

const ReportModal: React.FC<Props> = ({ targetId, targetKind, open, onClose }) => {
  const [reason, setReason] = useState('spam');
  const [details, setDetails] = useState('');
  const { state } = useAuth();

  const submit = async () => {
    if (state.status !== 'ready') {
      toast.error('signer required');
      return;
    }
    try {
      const reporterPubKey = state.pubkey;
      const ts = Math.floor(Date.now() / 1000);
      const report = { targetId, targetKind, reason, reporterPubKey, ts, details };
        const event = { kind: 30041, created_at: ts, content: JSON.stringify(report), pubkey: reporterPubKey };
        const signed = await state.signer.signEvent(event);
        const relays = getRelays();
        try {
          await pool.publish(relays, signed);
        } catch (err) {
          console.error('Failed to publish report', err);
          throw err;
        }
      await fetch('/api/modqueue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report),
      });
      window.dispatchEvent(new Event('modqueue'));
      toast.success('Reported');
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to report');
    }
  };

  if (!open) return null;

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-80 -translate-x-1/2 -translate-y-1/2 rounded bg-background-primary p-4 text-primary focus:outline-none">
          <Dialog.Title className="mb-2 font-semibold">Report</Dialog.Title>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mb-2 w-full rounded border p-2 text-sm"
          >
            <option value="spam">Spam</option>
            <option value="nudity">Nudity</option>
            <option value="harassment">Harassment</option>
            <option value="other">Other</option>
          </select>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            className="mb-2 w-full rounded border p-2 text-sm"
            placeholder="Details (optional)"
          />
          <div className="flex justify-end space-x-2">
            <Dialog.Close asChild>
              <button className="px-3 py-1" onClick={onClose}>
                Cancel
              </button>
            </Dialog.Close>
            <button className="rounded bg-accent-primary px-3 py-1 text-white" onClick={submit}>
              Submit
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default ReportModal;
