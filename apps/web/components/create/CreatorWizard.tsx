'use client'
import { UploadStep } from './UploadStep'

export default function CreatorWizard() {
  return (
    <main className="max-w-2xl mx-auto py-12 px-4 space-y-6">
      <h1 className="text-3xl font-bold">Create Video</h1>
      <UploadStep />
    </main>
  )
}
