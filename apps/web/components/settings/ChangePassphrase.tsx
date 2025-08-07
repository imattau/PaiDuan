import { useAuth } from '../../context/authContext';
import { encryptPrivkeyHex } from '../../utils/cryptoVault';
import { saveKey } from '../../utils/keyStorage';
import { promptPassphrase } from '../../utils/promptPassphrase';

export function ChangePassphrase() {
  const auth = useAuth();
  if (!auth.auth || auth.auth.method === 'nip07' || auth.auth.method === 'public')
    return null;

  async function run() {
    if (!auth.privkeyHex) {
      const p = await promptPassphrase('Enter current passphrase');
      if (!p) return;
      try {
        await auth.unlock(p);
      } catch {
        alert('Incorrect passphrase');
        return;
      }
    }
    if (!auth.privkeyHex) return;
    const newPass = await promptPassphrase('Enter new passphrase');
    if (!newPass) return;
    if (newPass.length < 8) {
      alert('Passphrase must be at least 8 characters');
      return;
    }
    const encPriv = await encryptPrivkeyHex(auth.privkeyHex, newPass);
    const updated = { ...auth.auth, encPriv } as any;
    saveKey(updated);
    alert('Passphrase updated');
    auth.lock();
  }

  return (
    <button onClick={run} className="px-3 py-2 rounded border">
      Change passphrase
    </button>
  );
}

