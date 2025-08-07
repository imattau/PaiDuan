import { useAuth } from '../context/authContext';
import { signWithAuth } from '../utils/signWithAuth';

export function usePublisher() {
  const auth = useAuth();

  async function publishNote(content: string, tags: string[][]) {
    const event: any = {
      kind: 1,
      content,
      tags,
      pubkey: auth?.pubkey,
      created_at: Math.floor(Date.now() / 1000),
    };

    try {
      const signed = await signWithAuth(event, auth);
      // publish signed event
    } catch (e: any) {
      alert(e.message || 'Sign-in required');
    }
  }

  return { publishNote };
}
