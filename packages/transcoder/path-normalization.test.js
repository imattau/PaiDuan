import { describe, it, expect } from 'vitest';

describe('path normalization', () => {
  it('converts Windows-style backslashes to forward slashes', () => {
    const winPath = 'variants\\240.webm';
    const normalized = winPath.replace(/\\/g, '/');
    expect(normalized).toBe('variants/240.webm');
  });
});
