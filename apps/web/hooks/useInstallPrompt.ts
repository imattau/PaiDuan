import { useEffect, useState } from 'react'

export default function useInstallPrompt() {
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null)
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setEvt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler as any)
    return () => window.removeEventListener('beforeinstallprompt', handler as any)
  }, [])
  return { canInstall: !!evt, showPrompt: () => evt?.prompt() }
}

declare interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
}
