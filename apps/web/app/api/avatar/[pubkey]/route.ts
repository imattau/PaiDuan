import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';

function generateIdenticon(pubkey: string): string {
  const hash = createHash('sha256').update(pubkey).digest('hex');
  const color = `#${hash.slice(0, 6)}`;
  const size = 5;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges">`;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < Math.ceil(size / 2); x++) {
      const i = x + y * Math.ceil(size / 2);
      const fill = parseInt(hash[i], 16) % 2 === 0;
      if (fill) {
        svg += `<rect x="${x}" y="${y}" width="1" height="1" fill="${color}"/>`;
        if (x !== size - 1 - x) {
          svg += `<rect x="${size - 1 - x}" y="${y}" width="1" height="1" fill="${color}"/>`;
        }
      }
    }
  }
  svg += '</svg>';
  return svg;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { pubkey: string } },
) {
  const svg = generateIdenticon(params.pubkey);
  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}

export async function HEAD(
  req: NextRequest,
  ctx: { params: { pubkey: string } },
) {
  const res = await GET(req, ctx);
  return new NextResponse(null, { status: res.status, headers: res.headers });
}
