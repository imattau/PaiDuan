import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../context/authContext'
import { promptPassphrase } from '../../utils/promptPassphrase'
import { SimplePool, EventTemplate, finalizeEvent } from 'nostr-tools'
import { hexToBytes } from '@noble/hashes/utils'

export default function ProfileOnboarding() {
  const { pubkey, auth, privkeyHex, unlock } = useAuth()
  const [name, setName] = useState('')
  const [about, setAbout] = useState('')
  const [picture, setPicture] = useState('')
  const [loading, setLoading] = useState(false)
  const poolRef = useRef<SimplePool>()

  useEffect(() => {
    if (!pubkey) return
    const pool = (poolRef.current ||= new SimplePool())
    const relays = ['wss://relay.damus.io', 'wss://nos.lol']
    const sub = pool.subscribeMany(relays, [{ kinds: [0], authors: [pubkey], limit: 1 }], {
      onevent(ev) {
        try {
          const c = JSON.parse(ev.content)
          setName(c.name || '')
          setAbout(c.about || '')
          setPicture(c.picture || '')
        } catch {}
      }
    })
    return () => sub.close()
  }, [pubkey])

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setPicture(reader.result as string)
    reader.readAsDataURL(file)
  }

  async function saveProfile() {
    if (!pubkey) return
    const content = JSON.stringify({ name, about, picture })
    const tmpl: EventTemplate = {
      kind: 0,
      created_at: Math.floor(Date.now() / 1000),
      tags: [],
      content
    }
    let signed
    if (auth?.method === 'nip07') {
      const nostr = (window as any).nostr
      if (!nostr?.signEvent) {
        alert('No signer available')
        return
      }
      signed = await nostr.signEvent({ ...tmpl, pubkey })
    } else {
      let key = privkeyHex
      if (!key) {
        const pass = await promptPassphrase('Enter passphrase to unlock key')
        if (!pass) return
        try {
          key = await unlock(pass)
        } catch {
          alert('Incorrect passphrase')
          return
        }
      }
      if (!key) {
        alert('Key is locked')
        return
      }
      signed = finalizeEvent({ ...tmpl, pubkey }, hexToBytes(key))
    }
    const pool = (poolRef.current ||= new SimplePool())
    setLoading(true)
    await pool.publish(['wss://relay.damus.io', 'wss://nos.lol'], signed)
    setLoading(false)
    window.location.href = `/feed`
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl mb-4">Set up your profile</h1>
      <div className="w-full max-w-md space-y-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="w-full rounded border p-2 text-black"
        />
        <textarea
          value={about}
          onChange={(e) => setAbout(e.target.value)}
          placeholder="Bio"
          className="w-full rounded border p-2 text-black"
        />
        <input type="file" accept="image/*" onChange={handleFile} />
        {picture && (
          <img src={picture} alt="avatar" className="h-24 w-24 rounded-full object-cover" />
        )}
        <button
          onClick={saveProfile}
          disabled={loading}
          className="px-4 py-2 rounded-xl border bg-yellow-100/70 hover:bg-yellow-100 text-gray-900 disabled:opacity-50"
        >
          {loading ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )
}
