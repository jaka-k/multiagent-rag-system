'use client'

import useDocumentStore from '@context/document-store.tsx'
import { useFirebaseUpload } from '@hooks/use-firebase-upload.tsx'
import { extractEpubMetadata } from '@lib/epub/extract-metadata.ts'
import {
  createDocument,
  createVectorEmbedding
} from '@lib/fetchers/fetch-embedding.ts'
import { logger } from '@lib/logger.ts'
import { createPersistentDownloadUrl, noSpaceFilename } from '@lib/utils'
import type { Area, EmbeddingStatus } from '@mytypes/types.d.ts'
import { Book, Check, Layers, RefreshCw, Upload, X, Zap } from 'lucide-react'
import React from 'react'

type RowStatus = EmbeddingStatus | 'uploading'

interface UploadRow {
  key: string
  file: File
  status: 'idle' | 'uploading' | 'failed'
  docId?: string
  error?: string
}

const STATUS_ICON: Record<RowStatus, React.ComponentType<{ size?: number }>> = {
  idle: Book,
  uploading: Upload,
  processing: RefreshCw,
  embedding: Layers,
  completed: Check,
  failed: Zap
}

const STATUS_LABEL: Record<RowStatus, string> = {
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

interface UploadDialogProps {
  area: Area
  onClose: () => void
}

export function UploadDialog({ area, onClose }: UploadDialogProps) {
  const { documentsByArea, fetchDocumentsForArea } = useDocumentStore()
  const { uploadProgress, uploadFile, uploadCover } = useFirebaseUpload()
  const [rows, setRows] = React.useState<UploadRow[]>([])
  const [running, setRunning] = React.useState(false)
  const [dragging, setDragging] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const docs = documentsByArea[area.id] ?? {}

  const statusOf = (row: UploadRow): RowStatus => {
    if (row.docId && docs[row.docId]) return docs[row.docId].embeddingStatus

    return row.status
  }

  const labelOf = (row: UploadRow): string => {
    const status = statusOf(row)

    if (status === 'failed')
      return row.error ?? 'Indexing failed — check the file and retry'

    return STATUS_LABEL[status]
  }

  const patchRow = (key: string, fields: Partial<UploadRow>) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...fields } : r)))

  const addFiles = (files: FileList | File[]) => {
    const epubs = Array.from(files).filter((f) => f.name.endsWith('.epub'))

    setRows((rs) => [
      ...rs,
      ...epubs.map((file) => ({
        key: `${file.name}-${Date.now()}-${Math.random()}`,
        file,
        status: 'idle' as const
      }))
    ])
  }

  /** Client half of the pipeline: extract cover → Firebase → create + embed.
   *  From then on the row's status comes from the document store. */
  const runRow = async (row: UploadRow) => {
    patchRow(row.key, { status: 'uploading', error: undefined })

    try {
      const meta = await extractEpubMetadata(row.file)

      if (!meta.coverImage) throw new Error('No cover image found in EPUB')

      const fileMeta = await uploadFile(
        row.file,
        `epubs/${noSpaceFilename(row.file.name)}`
      )
      const coverMeta = await uploadCover(row.file, meta.coverImage)

      const response = await createDocument({
        title: meta.metadata.title ?? fileMeta.name,
        areaId: area.id,
        description: meta.metadata.description || meta.metadata.title || '',
        filePath: fileMeta.fullPath,
        fileSize: fileMeta.size,
        coverImage: createPersistentDownloadUrl(coverMeta),
        author: meta.metadata.creator
      })

      await createVectorEmbedding(response.id)
      patchRow(row.key, { docId: response.id })
      await fetchDocumentsForArea(area.id)
    } catch (err) {
      logger.error({ err }, 'EPUB upload failed')
      patchRow(row.key, {
        status: 'failed',
        error: err instanceof Error ? err.message : 'Upload failed'
      })
    }
  }

  const start = async () => {
    setRunning(true)

    try {
      const queued = rows.filter((r) => r.status === 'idle')

      // Sequential on purpose: one Firebase upload + one worker at a time.
      // eslint-disable-next-line no-restricted-syntax
      for (const row of queued) {
        // eslint-disable-next-line no-await-in-loop
        await runRow(row)
      }
    } finally {
      setRunning(false)
    }
  }

  const retry = async (row: UploadRow) => {
    if (row.docId) {
      // Backend pipeline failed — re-fire it for the existing document.
      await createVectorEmbedding(row.docId)
      await fetchDocumentsForArea(area.id)
    } else {
      await runRow(row)
    }
  }

  // While any handed-off row is processing/embedding, keep the store fresh.
  const anyBackendBusy = rows.some((r) =>
    ['processing', 'embedding'].includes(statusOf(r))
  )

  React.useEffect(() => {
    if (!anyBackendBusy) return undefined

    const timer = setInterval(() => fetchDocumentsForArea(area.id), 2500)

    return () => clearInterval(timer)
  }, [anyBackendBusy, area.id, fetchDocumentsForArea])

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', onKey)

    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const queuedCount = rows.filter((r) => r.status === 'idle').length
  const anyBusy = running || anyBackendBusy
  const done =
    rows.length > 0 &&
    rows.every((r) => ['completed', 'failed'].includes(statusOf(r)))

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="modal wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="m-head">
          <div
            className="m-ico"
            style={{ background: 'var(--blue-wash)', color: 'var(--blue)' }}
          >
            <Upload size={18} />
          </div>
          <div>
            <h3 id="upload-title">Add books to {area.name}</h3>
            <p>
              EPUBs are parsed into chapters, then embedded for retrieval. You
              can keep working while they index.
            </p>
          </div>
          <button type="button" className="icon-btn" onClick={onClose}>
            <X size={17} />
          </button>
        </div>
        <div className="m-body">
          <div
            className={dragging ? 'dz drag' : 'dz'}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragging(false)
              addFiles(e.dataTransfer.files)
            }}
          >
            <Upload size={22} />
            <div className="dz-t">Drop EPUB files here</div>
            <div className="dz-s">
              or <b>browse</b> — up to 50 MB each
            </div>
            <input
              ref={inputRef}
              type="file"
              accept=".epub"
              multiple
              hidden
              onChange={(e) => {
                if (e.target.files) addFiles(e.target.files)
                e.target.value = ''
              }}
            />
          </div>
          <div className="uplist">
            {rows.map((row) => {
              const status = statusOf(row)
              const Icon = STATUS_ICON[status]

              return (
                <div className={`uprow ${status}`} key={row.key}>
                  <div className="up-ico">
                    <Icon size={15} />
                  </div>
                  <div className="up-mid">
                    <div className="up-f">
                      {row.file.name}
                      <span className="up-size">
                        {prettySize(row.file.size)}
                      </span>
                    </div>
                    {status === 'uploading' && (
                      <div className="bbar">
                        <i style={{ width: `${uploadProgress}%` }} />
                      </div>
                    )}
                    <div className="up-l">{labelOf(row)}</div>
                  </div>
                  {status === 'failed' && (
                    <button
                      type="button"
                      className="btn btn-soft esm"
                      onClick={() => retry(row)}
                    >
                      <RefreshCw size={13} /> Retry
                    </button>
                  )}
                  {status === 'completed' && (
                    <span className="up-pct done">
                      <Check size={14} />
                    </span>
                  )}
                  {status === 'uploading' && (
                    <span className="up-pct">
                      {Math.round(uploadProgress)}%
                    </span>
                  )}
                  {status === 'idle' && (
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() =>
                        setRows((rs) => rs.filter((r) => r.key !== row.key))
                      }
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>
              )
            })}
            {rows.length === 0 && (
              <div className="up-none">No files selected yet.</div>
            )}
          </div>
        </div>
        <div className="m-foot">
          <span className="m-note">
            idle → uploading → processing → embedding → completed
          </span>
          {done ? (
            <button type="button" className="btn btn-pri" onClick={onClose}>
              <Check size={15} /> Done
            </button>
          ) : (
            <>
              <button type="button" className="btn btn-ghost" onClick={onClose}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-pri"
                disabled={anyBusy || queuedCount === 0}
                onClick={start}
              >
                {anyBusy ? <RefreshCw size={15} /> : <Upload size={15} />}
                {anyBusy
                  ? 'Indexing…'
                  : `Start upload${queuedCount > 1 ? ` (${queuedCount})` : ''}`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
