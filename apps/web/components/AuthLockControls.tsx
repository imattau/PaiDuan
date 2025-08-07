import { useState } from 'react';
import { useAuth } from '../context/authContext';

export function AuthLockControls() {
  const auth = useAuth();
  const [busy, setBusy] = useState(false);

  if (!auth.auth || auth.auth.method === 'public') return null;

  async function unlock() {
    const pass = prompt('Enter passphrase');
    if (!pass) return;
    setBusy(true);
    try {
      await auth.unlock(pass);
      alert('Unlocked');
    } catch {
      alert('Incorrect passphrase');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {auth.isUnlocked ? (
        <button onClick={auth.lock} disabled={busy} className="btn-outline">
          Lock
        </button>
      ) : (
        <button onClick={unlock} disabled={busy} className="btn-outline">
          Unlock
        </button>
      )}
    </div>
  );
}

