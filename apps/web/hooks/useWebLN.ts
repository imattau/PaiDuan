import { useEffect, useState } from 'react';

interface WebLNProvider {
  getInfo: () => Promise<any>;
  sendPayment: (invoice: string) => Promise<any>;
}

declare global {
  interface Window {
    webln?: WebLNProvider;
  }
}

export default function useWebLN() {
  const [webln, setWebln] = useState<WebLNProvider | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.webln) {
      setWebln(window.webln);
    }
  }, []);

  const getInfo = async () => {
    if (!webln) throw new Error('WebLN not available');
    return webln.getInfo();
  };

  const sendPayment = async (invoice: string) => {
    if (webln) {
      return webln.sendPayment(invoice);
    }
    if (typeof window !== 'undefined') {
      window.open(`lightning:${invoice}`);
    }
  };

  return { webln, getInfo, sendPayment };
}

