'use client'
import React from 'react'

export function UploadStep({ onBack }: { onBack: () => void }) {
  // TODO: hook into existing upload flow
  return (
    <section className="space-y-4">
      <p className="text-sm text-muted-foreground">Upload flow coming soon.</p>
      <button onClick={onBack} className="btn btn-secondary">Back</button>
    </section>
  )
}
