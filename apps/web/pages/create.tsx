import dynamic from 'next/dynamic'
import { useEffect } from 'react'
import { loadFFmpeg } from '@/utils/ffmpeg'
const CreatorWizard = dynamic(() => import('@/components/create/CreatorWizard'), { ssr: false })

export default function CreatePage() {
  useEffect(() => {
    loadFFmpeg()
  }, [])

  return <CreatorWizard />
}

