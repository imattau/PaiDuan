import type { EventTemplate } from 'nostr-tools/pure';

interface ZapSplit {
  lnaddr: string;
  pct: number;
}

interface VideoEventParams {
  caption: string;
  topics: string;
  license: string;
  lightningAddress: string;
  zapSplits: ZapSplit[];
  nsfw: boolean;
  dimensions: { width: number; height: number };
  video: string;
  poster: string;
  manifest?: string;
  mimeTag: string;
  pubkey: string;
}

export function createVideoEvent(params: VideoEventParams): EventTemplate & {
  pubkey: string;
} {
  const {
    caption,
    topics,
    license,
    lightningAddress,
    zapSplits,
    nsfw,
    dimensions,
    video,
    poster,
    manifest,
    mimeTag,
    pubkey,
  } = params;

  const topicList = topics
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
  const totalPctSubmit = zapSplits.reduce((sum, s) => sum + s.pct, 0);
  const dim = `${dimensions.width}x${dimensions.height}`;

  const tags: string[][] = [
    ['title', caption],
    ['published_at', Math.floor(Date.now() / 1000).toString()],
    ['imeta', `dim ${dim}`, `url ${video}`, mimeTag, `image ${poster}`],
    ...topicList.map((t) => ['t', t]),
  ];

  if (manifest) {
    tags.push([
      'imeta',
      `dim ${dim}`,
      `url ${manifest}`,
      'm application/x-mpegURL',
      `image ${poster}`,
    ]);
  }

  const creatorPct = Math.max(0, 100 - totalPctSubmit);
  if (lightningAddress) {
    tags.push(['zap', lightningAddress, creatorPct.toString()]);
  }
  zapSplits.forEach((s) => {
    if (s.lnaddr && s.pct > 0) {
      tags.push(['zap', s.lnaddr, s.pct.toString()]);
    }
  });
  if (nsfw) tags.push(['content-warning', 'nsfw']);
  if (license) tags.push(['copyright', license]);

  const kind = dimensions.width >= dimensions.height ? 21 : 22;

  const event: EventTemplate & { pubkey: string } = {
    kind,
    created_at: Math.floor(Date.now() / 1000),
    content: caption,
    tags,
    pubkey,
  };

  return event;
}

const media = { createVideoEvent };
export default media;
