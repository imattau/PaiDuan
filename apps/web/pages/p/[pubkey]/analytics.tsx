import { useRouter } from 'next/router';
import useCreatorAnalytics from '../../../hooks/useCreatorAnalytics';
import { Button, StatCard, TimeSeriesChart } from '@paiduan/ui';

export default function CreatorAnalytics() {
  const router = useRouter();
  const { pubkey } = router.query as { pubkey: string };
  const { data, loading } = useCreatorAnalytics(pubkey);

  const downloadCsv = () => {
    if (!data) return;
    const header = ['date', 'views', 'zapsSats', 'comments', 'followerDelta', 'revenueAud'];
    const rows = data.dailySeries.map((d: any) =>
      [d.date, d.views, d.zapsSats, d.comments, d.followerDelta, d.revenueAud].join(',')
    );
    const csv = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'creator-stats.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <p>Loading...</p>;
  if (!data) return <p>No data</p>;

  const { totals } = data;

  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Views" total={totals.views} />
        <StatCard label="Zaps (sats)" total={totals.zapsSats} />
        <StatCard label="Comments" total={totals.comments} />
        <StatCard label="Follower Δ" total={totals.followerDelta} />
        <StatCard label="Revenue A$" total={totals.revenueAud.toFixed(2)} />
      </div>
      <Button onClick={downloadCsv} className="btn-primary">
        Download CSV
      </Button>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TimeSeriesChart
          data={data.dailySeries}
          lines={[
            { dataKey: 'views', color: '#8884d8' },
            { dataKey: 'zapsSats', color: '#82ca9d' },
          ]}
        />
        <TimeSeriesChart
          data={data.dailySeries}
          lines={[{ dataKey: 'revenueAud', color: '#82ca9d', type: 'area', stackId: '1' }]}
        />
      </div>
    </div>
  );
}
