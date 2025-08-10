export function track(event: string, data?: any) {
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.error('[telemetry]', event, data);
  }
}

export const telemetry = { track };
export default telemetry;
