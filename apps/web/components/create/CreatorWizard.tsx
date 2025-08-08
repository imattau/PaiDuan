'use client'
import { useState } from 'react'
import { UploadStep } from './UploadStep'
import { RecordStep } from './RecordStep'

export default function CreatorWizard() {
  const [mode, setMode] = useState<'upload' | 'record' | null>(null)

  return (
    <main className="max-w-2xl mx-auto py-12 px-4 space-y-6">
      <h1 className="text-3xl font-bold">Create Video</h1>
      {!mode && (
        <section className="rounded-2xl border bg-white/5 dark:bg-neutral-900 p-6 space-y-3">
          <p className="text-sm text-muted-foreground">Choose how you want to create:</p>
          <div className="flex gap-3 flex-wrap">
            <button className="btn btn-primary" onClick={() => setMode('upload')}>📁 Upload a file</button>
            <button className="btn btn-secondary" onClick={() => setMode('record')}>🎥 Record</button>
          </div>
        </section>
      )}
      {mode === 'upload' && <UploadStep onBack={() => setMode(null)} />}
      {mode === 'record' && <RecordStep onBack={() => setMode(null)} />}
    </main>
  )
}
