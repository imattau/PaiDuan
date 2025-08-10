import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import webpush from 'web-push';

const subscriptions: webpush.PushSubscription[] = [];

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:example@paiduan.app',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export async function POST(req: NextRequest) {
  const { subscription, notification } = await req.json();

  if (subscription) {
    subscriptions.push(subscription);
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  if (notification) {
    const payload = JSON.stringify(notification);
    await Promise.all(
      subscriptions.map((sub) => webpush.sendNotification(sub, payload).catch(() => undefined))
    );
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
}
