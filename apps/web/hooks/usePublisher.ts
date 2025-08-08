import { useAuth } from './useAuth';

export function usePublisher() {
  const { state } = useAuth();

  async function publishNote(content: string, tags: string[][]) {
    const event: any = {
      kind: 1,
      content,
      tags,
      pubkey: state.status === 'ready' ? state.pubkey : undefined,
      created_at: Math.floor(Date.now() / 1000),
    };

    try {
      if (state.status !== 'ready') throw new Error('Not signed in');
      const signed = await state.signer.signEvent(event);
      // publish signed event
    } catch (e: any) {
      alert(e.message || 'Sign-in required');
    }
  }

  return { publishNote };
}
