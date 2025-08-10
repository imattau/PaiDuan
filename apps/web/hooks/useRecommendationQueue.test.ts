/* @vitest-environment jsdom */
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import useRecommendationQueue from './useRecommendationQueue';
import { feedService } from '@/lib/feed-service';

vi.mock('@/lib/feed-service', () => ({
  feedService: {
    fetchRecommendations: vi.fn(),
  },
}));

describe('useRecommendationQueue', () => {
  it('fetches more when below threshold', async () => {
    const item = { videoUrl: '', author: 'a', caption: '', eventId: '1', pubkey: 'p' };
    const mockFetch = feedService.fetchRecommendations as unknown as vi.Mock;
    mockFetch
      .mockResolvedValueOnce({ items: [item], nextCursor: 'c2' })
      .mockResolvedValueOnce({ items: [item], nextCursor: undefined });

    const { result } = renderHook(() => useRecommendationQueue(2));

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));

    act(() => result.current.markSeen());

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(result.current.queue.length).toBe(1));
  });
});
