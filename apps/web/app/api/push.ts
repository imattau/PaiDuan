import type { NextApiRequest, NextApiResponse } from 'next';
import webpush from 'web-push';

const subscriptions: webpush.PushSubscription[] = [];

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:example@paiduan.app',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).end();
    return;
  }

  const { subscription, notification } = req.body;

  if (subscription) {
    subscriptions.push(subscription);
    res.status(201).json({ ok: true });
    return;
  }

  if (notification) {
    const payload = JSON.stringify(notification);
    await Promise.all(
      subscriptions.map((sub) =>
        webpush.sendNotification(sub, payload).catch(() => undefined)
      )
    );
    res.status(200).json({ ok: true });
    return;
  }

  res.status(400).json({ error: 'Invalid body' });
}
