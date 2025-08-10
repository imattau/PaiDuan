import { useEffect } from 'react'
import toast from 'react-hot-toast'
import { useNetworkState } from 'react-use'

export default function useOffline() {
  const { online } = useNetworkState()

    useEffect(() => {
      if (online === false) {
        toast('You are offline')
      }
    }, [online])

  return online
}
