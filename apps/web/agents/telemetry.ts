import analytics from '@/utils/analytics';

export function track(event: string, data?: any) {
  analytics.trackEvent(event, data ? { props: data } : undefined);

  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.warn('[telemetry]', event, data);
  }
}

export const telemetry = { track };
export default telemetry;
