import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) {
    return new NextResponse('Missing url', { status: 400 });
  }
  try {
    const upstream = await fetch(url);
    const contentType = upstream.headers.get('content-type');
    if (!upstream.ok || !contentType?.startsWith('image/')) {
      return new NextResponse('Not an image', { status: 404 });
    }
    const body = await upstream.arrayBuffer();
    return new NextResponse(body, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': contentType,
      },
    });
  } catch {
    return new NextResponse('Bad Gateway', { status: 502 });
  }
}
