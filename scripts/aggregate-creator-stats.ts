import fs from 'fs';
import path from 'path';
import { CreatorStatsStore, Event } from '../apps/web/lib/creatorStatsStore';

const STORE_PATH = path.join(__dirname, 'creator-stats.json');
const store = new CreatorStatsStore(STORE_PATH);

export async function run(pubkey: string, events: Event[]) {
  const stats = store.aggregate(events);
  const data = store.read();
  data[pubkey] = stats;
  store.write(data);
  return stats;
}

if (require.main === module) {
  const pubkey = process.argv[2];
  const eventsFile = process.argv[3];
  if (!pubkey || !eventsFile) {
    console.error('usage: ts-node aggregate-creator-stats.ts <pubkey> <events.json>');
    process.exit(1);
  }
  const events = JSON.parse(fs.readFileSync(eventsFile, 'utf8')) as Event[];
  run(pubkey, events).then(() => console.log('aggregated'));
}
