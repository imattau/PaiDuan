import { NextRequest, NextResponse } from 'next/server';
import { ModQueueService, Report } from '../../../lib/modqueue-service';

const service = new ModQueueService();

export async function GET() {
  const data = await service.read();
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const report = (await request.json()) as Report;
  await service.add(report);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const { targetId } = (await request.json()) as { targetId: string };
  await service.remove(targetId);
  return NextResponse.json({ ok: true });
}

