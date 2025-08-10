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

interface LineDef<T extends Record<string, unknown>> {
  dataKey: keyof T;
  color: string;
  type?: 'line' | 'area';
  stackId?: string;
}

interface Props<T extends Record<string, unknown>> {
  data: T[];
  lines: LineDef<T>[];
}

export function TimeSeriesChart<T extends Record<string, unknown>>({
  data,
  lines,
}: Props<T>) {
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
              key={String(l.dataKey)}
              type="monotone"
              dataKey={String(l.dataKey)}
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
          <Line
            key={String(l.dataKey)}
            type="monotone"
            dataKey={String(l.dataKey)}
            stroke={l.color}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export default TimeSeriesChart;
