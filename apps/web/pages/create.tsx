import dynamic from 'next/dynamic'
import { useEffect } from 'react'
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg'

const ffmpeg = createFFmpeg({ log: true })
const CreatorWizard = dynamic(() => import('@/components/create/CreatorWizard'), { ssr: false })

export default function CreatePage() {
  useEffect(() => {
    ffmpeg.load()
  }, [])

  return <CreatorWizard />
}

export { ffmpeg, fetchFile }
