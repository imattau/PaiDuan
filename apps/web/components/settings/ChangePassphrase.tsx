import { useAuth } from '../../context/authContext';
import { encryptPrivkeyHex } from '../../utils/cryptoVault';
import { saveKey } from '../../utils/keyStorage';

export function ChangePassphrase() {
  const auth = useAuth();
  if (!auth.auth || auth.auth.method === 'nip07' || auth.auth.method === 'public')
    return null;

  async function run() {
    if (!auth.privkeyHex) {
      const p = prompt('Enter current passphrase');
      if (!p) return;
      try {
        await auth.unlock(p);
      } catch {
        alert('Incorrect passphrase');
        return;
      }
    }
    if (!auth.privkeyHex) return;
    const newPass = prompt('Enter new passphrase');
    if (!newPass) return;
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

