import type { NextApiRequest, NextApiResponse } from 'next';
import { ModQueueService, Report } from '../../lib/modqueue-service';

const service = new ModQueueService();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const report = req.body as Report;
    await service.add(report);
    res.status(200).json({ ok: true });
    return;
  }

  if (req.method === 'DELETE') {
    const { targetId } = req.body as { targetId: string };
    await service.remove(targetId);
    res.status(200).json({ ok: true });
    return;
  }

  const data = await service.read();
  res.status(200).json(data);
}
