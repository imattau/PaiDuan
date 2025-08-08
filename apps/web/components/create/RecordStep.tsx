'use client'
import React from 'react'

export function RecordStep({ onBack }: { onBack: () => void }) {
  // TODO: hook into existing recording flow
  return (
    <section className="space-y-4">
      <p className="text-sm text-muted-foreground">Recording flow coming soon.</p>
      <button onClick={onBack} className="btn btn-secondary">Back</button>
    </section>
  )
}
