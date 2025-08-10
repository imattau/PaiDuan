import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import Overlay from './ui/Overlay';
import { modqueue } from '@/agents/modqueue';

interface Props {
  targetId: string;
  targetKind: 'video' | 'comment';
  onClose?: () => void;
}

function ReportModalContent({ targetId, targetKind, onClose }: Props) {
  const [reason, setReason] = useState('spam');
  const [details, setDetails] = useState('');
  const { state } = useAuth();

  const submit = async () => {
    if (state.status !== 'ready') {
      toast.error('signer required');
      return;
    }
    try {
      await modqueue.submitReport({
        targetId,
        targetKind,
        reason,
        reporterPubKey: state.pubkey,
        ts: Math.floor(Date.now() / 1000),
        details,
        signer: state.signer,
      });
      toast.success('Reported');
      Overlay.close();
      onClose?.();
    } catch (err) {
      console.error(err);
      toast.error('Failed to report');
    }
  };

  return (
    <div className="w-80 p-4 text-primary">
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
        <button className="px-3 py-1" onClick={() => { Overlay.close(); onClose?.(); }}>
          Cancel
        </button>
        <button className="rounded bg-accent-primary px-3 py-1 text-white" onClick={submit}>
          Submit
        </button>
      </div>
    </div>
  );
}

export default function ReportModal(props: Props) {
  Overlay.open('modal', { content: <ReportModalContent {...props} />, onClose: props.onClose });
}
