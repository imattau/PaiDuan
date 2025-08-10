import type { AxiosError } from 'axios';

/**
 * Returns a cloneable error object so Vitest workers can serialize Axios failures.
 */
export function sanitizeAxiosError(error: unknown): Error {
  if (!error || typeof error !== 'object') {
    return error instanceof Error ? error : new Error(String(error));
  }
  const err = error as AxiosError & Record<string, any>;
  let data: any;
  if (typeof err.toJSON === 'function') {
    data = err.toJSON();
  } else {
    data = { ...err };
    if (data.config) {
      data.config = { ...data.config };
      delete data.config.transformRequest;
      delete data.config.transformResponse;
    }
    delete data.request;
    if (data.response) {
      data.response = { ...data.response };
      delete data.response.request;
    }
  }
  const clean = new Error(err.message);
  Object.assign(clean, data);
  return clean;
}
