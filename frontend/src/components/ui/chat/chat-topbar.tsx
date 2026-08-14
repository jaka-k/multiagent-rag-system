'use client'

import { ArrowLeft, Plus } from 'lucide-react'
import Link from 'next/link'

export default function ChatTopbar({
  title,
  connected,
  onNewChat
}: {
  title: string
  connected: boolean
  onNewChat: () => void
}) {
  return (
    <div className="topbar">
      <Link href="/">
        <span className="backbtn">
          <ArrowLeft size={16} />
        </span>
      </Link>
      <div className="crumb">
        <span className="ti">{title}</span>
      </div>
      <span className="pill model">
        <span
          className="dot"
          style={{ background: connected ? 'var(--green)' : 'var(--rose)' }}
        />
        {connected ? 'Connected' : 'Disconnected'}
      </span>
      <div className="top-actions">
        <button
          type="button"
          className="icon-btn"
          onClick={onNewChat}
          aria-label="New chat"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  )
}
