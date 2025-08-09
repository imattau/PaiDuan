export async function canDecode(mime: string): Promise<boolean> {
  if (typeof window === 'undefined' || !(window as any).VideoDecoder) {
    return false;
  }
  const match = /codecs?="?([^";]+)/i.exec(mime);
  const codecs = match ? match[1].split(',').map((c) => c.trim()) : [mime];
  for (const codec of codecs) {
    if (!codec) continue;
    try {
      const support = await (window as any).VideoDecoder.isConfigSupported({ codec });
      if (support?.supported) {
        return true;
      }
    } catch {
      /* ignore */
    }
  }
  return false;
}
