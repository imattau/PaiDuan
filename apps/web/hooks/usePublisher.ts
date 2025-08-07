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

    const signed = await signWithAuth(event, auth);
    // publish signed event
  }

  return { publishNote };
}
