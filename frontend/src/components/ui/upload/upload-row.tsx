'use client'

import type { EmbeddingStatus } from '@mytypes/types.d.ts'
import { Book, Check, Layers, RefreshCw, Upload, X, Zap } from 'lucide-react'
import React from 'react'

export type RowStatus = EmbeddingStatus | 'uploading'

const STATUS_ICON: Record<RowStatus, React.ComponentType<{ size?: number }>> = {
  idle: Book,
  uploading: Upload,
  processing: RefreshCw,
  embedding: Layers,
  completed: Check,
  failed: Zap
}

export const STATUS_LABEL: Record<RowStatus, string> = {
  idle: 'Ready to upload',
  uploading: 'Uploading…',
  processing: 'Parsing chapters…',
  embedding: 'Embedding chapters…',
  completed: 'Indexed',
  failed: 'Failed'
}

function prettySize(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

interface UploadRowProps {
  fileName: string
  fileSize: number
  status: RowStatus
  label: string
  uploadPct: number
  onRetry: () => void
  onRemove: () => void
}

export function UploadRow({
  fileName,
  fileSize,
  status,
  label,
  uploadPct,
  onRetry,
  onRemove
}: UploadRowProps) {
  const Icon = STATUS_ICON[status]

  return (
    <div className={`uprow ${status}`}>
      <div className="up-ico">
        <Icon size={15} />
      </div>
      <div className="up-mid">
        <div className="up-f">
          {fileName}
          <span className="up-size">{prettySize(fileSize)}</span>
        </div>
        {status === 'uploading' && (
          <div className="bbar">
            <i style={{ width: `${uploadPct}%` }} />
          </div>
        )}
        <div className="up-l">{label}</div>
      </div>
      {status === 'failed' && (
        <button type="button" className="btn btn-soft esm" onClick={onRetry}>
          <RefreshCw size={13} /> Retry
        </button>
      )}
      {status === 'completed' && (
        <span className="up-pct done">
          <Check size={14} />
        </span>
      )}
      {status === 'uploading' && (
        <span className="up-pct">{Math.round(uploadPct)}%</span>
      )}
      {status === 'idle' && (
        <button type="button" className="icon-btn" onClick={onRemove}>
          <X size={15} />
        </button>
      )}
    </div>
  )
}
