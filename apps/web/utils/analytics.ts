export const consentGiven = (): boolean => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('analytics-consent') === '1';
};

export const analyticsEnabled = (): boolean => {
  return process.env.NEXT_PUBLIC_ANALYTICS === 'enabled' && consentGiven();
};

export const trackEvent = (name: string, props?: Record<string, any>): void => {
  if (!analyticsEnabled()) return;
  (window as any).plausible?.(name, props ? { props } : undefined);
};

export const trackPageview = (url: string): void => {
  if (!analyticsEnabled()) return;
  (window as any).plausible?.('pageview', { u: url });
};
