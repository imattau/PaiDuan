import { promises as fs } from 'fs';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'apps', 'web', 'data', 'modqueue.json');

export type Report = {
  targetId: string;
  targetKind: 'video' | 'comment';
  reason: string;
  reporterPubKey: string;
  ts: number;
};

export class ModQueueService {
  constructor(private filePath: string = DATA_PATH) {}

  async read(): Promise<Report[]> {
    try {
      const raw = await fs.readFile(this.filePath);
      return JSON.parse(raw.toString('utf8')) as Report[];
    } catch {
      return [];
    }
  }

  async write(data: Report[]): Promise<void> {
    await fs.writeFile(this.filePath, JSON.stringify(data, null, 2));
  }

  async add(report: Report): Promise<void> {
    const data = await this.read();
    data.push(report);
    await this.write(data);
  }

  async remove(targetId: string): Promise<void> {
    const data = await this.read();
    const filtered = data.filter((r) => r.targetId !== targetId);
    await this.write(filtered);
  }
}
