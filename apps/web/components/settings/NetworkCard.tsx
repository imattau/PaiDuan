import React from 'react';
import { Card } from '../ui/Card';

export function NetworkCard() {
  return (
    <Card title="Network" desc="Connectivity options.">
      <div className="text-sm text-muted-foreground">No network settings available.</div>
    </Card>
  );
}

export default NetworkCard;
