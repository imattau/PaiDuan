import Plausible from 'plausible-tracker';

interface Tracker {
  trackEvent: (eventName: string, options?: any, data?: any) => void;
  trackPageview: (data?: any, options?: any) => void;
  enableAutoPageviews: () => () => void;
}

let tracker: Tracker = {
  trackEvent: () => {},
  trackPageview: () => {},
  enableAutoPageviews: () => () => {},
};

if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_ANALYTICS === 'enabled') {
  tracker = Plausible({
    domain: 'paiduan.app',
    apiHost: 'https://stats.paiduan.app',
  });
}

export default tracker;
