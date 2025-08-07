import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

interface LineDef {
  dataKey: string;
  color: string;
  type?: 'line' | 'area';
  stackId?: string;
}

interface Props {
  data: any[];
  lines: LineDef[];
}

export function TimeSeriesChart({ data, lines }: Props) {
  const hasArea = lines.some((l) => l.type === 'area');
  if (hasArea) {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          {lines.map((l) => (
            <Area
              key={l.dataKey}
              type="monotone"
              dataKey={l.dataKey}
              stackId={l.stackId}
              stroke={l.color}
              fill={l.color}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        {lines.map((l) => (
          <Line key={l.dataKey} type="monotone" dataKey={l.dataKey} stroke={l.color} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export default TimeSeriesChart;
