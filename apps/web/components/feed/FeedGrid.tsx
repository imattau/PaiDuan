import React from 'react'

export function FeedGrid({ items }: { items: React.ReactNode[] }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 columns-1 sm:columns-2 lg:columns-3 gap-4">
      {items.map((node, i) => (
        <div
          key={i}
          className="mb-4 break-inside-avoid-column inline-block align-top w-full"
        >
          {node}
        </div>
      ))}
    </div>
  )
}

export default FeedGrid
