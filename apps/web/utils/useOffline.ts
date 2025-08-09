import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

export default function useOffline() {
  const [online, setOnline] = useState(true)

  useEffect(() => {
    const update = () => {
      const status = navigator.onLine
      if (!status) {
        toast.info('You are offline')
      }
      setOnline(status)
    }
    update()
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])

  return online
}
