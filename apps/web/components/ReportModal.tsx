import React, { useState } from 'react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-80 rounded bg-background-primary p-4 text-primary">
        <h2 className="mb-2 font-semibold">Report</h2>
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
          <button className="px-3 py-1" onClick={onClose}>
            Cancel
          </button>
          <button className="rounded bg-accent-primary px-3 py-1 text-white" onClick={submit}>
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;
