import { VideoCardProps } from '@/components/VideoCard';
import { telemetry } from '@/agents/telemetry';

export interface RecommendationResponse {
  items: VideoCardProps[];
  nextCursor?: string;
}

export async function fetchRecommendations(cursor?: string): Promise<RecommendationResponse> {
  const url = cursor
    ? `/api/recommendations?cursor=${encodeURIComponent(cursor)}`
    : '/api/recommendations';
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch recommendations');
  const data: RecommendationResponse = await res.json();
  telemetry.track('feed.fetch', { cursor, count: data.items.length });
  return data;
}

export async function logInteraction(
  itemId: string,
  data: { watchTime?: number; liked?: boolean },
): Promise<void> {
  telemetry.track('feed.interaction', { itemId, ...data });
  await fetch('/api/recommendations/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itemId, ...data }),
  });
}

export const feedService = { fetchRecommendations, logInteraction };
export default feedService;
