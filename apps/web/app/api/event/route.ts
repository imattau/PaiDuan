import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { analyticsService } from '../../../lib/analytics';

export async function POST(req: NextRequest) {
  if (process.env.NEXT_PUBLIC_ANALYTICS !== 'enabled') {
    return new NextResponse(null, { status: 204 });
  }
  try {
    await analyticsService.post(await req.json(), {
      'User-Agent': req.headers.get('user-agent') || '',
      'X-Forwarded-For': req.headers.get('x-forwarded-for') || '',
    });
  } catch {
    // ignore errors
  }
  return new NextResponse(null, { status: 204 });
}
