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
import type { Area } from '@mytypes/types.d.ts'
import { Dropzone } from '@ui/upload/dropzone'
import { RowStatus, STATUS_LABEL, UploadRow } from '@ui/upload/upload-row'
import { Check, RefreshCw, Upload, X } from 'lucide-react'
import React from 'react'

interface Row {
  key: string
  file: File
  status: 'idle' | 'uploading'
  docId?: string
  error?: string
}

interface UploadDialogProps {
  area: Area
  onClose: () => void
}

export function UploadDialog({ area, onClose }: UploadDialogProps) {
  const { documentsByArea, fetchDocumentsForArea } = useDocumentStore()
  const { uploadProgress, uploadFile, uploadCover } = useFirebaseUpload()
  const [rows, setRows] = React.useState<Row[]>([])
  const [running, setRunning] = React.useState(false)

  const docs = documentsByArea[area.id] ?? {}

  // A client-side error wins until retried; otherwise the handed-off
  // document's store status is the truth.
  const statusOf = (row: Row): RowStatus => {
    if (row.error) return 'failed'

    if (row.docId && docs[row.docId]) return docs[row.docId].embeddingStatus

    return row.status
  }

  const labelOf = (row: Row): string => {
    const status = statusOf(row)

    if (status === 'failed')
      return row.error ?? 'Indexing failed — check the file and retry'

    return STATUS_LABEL[status]
  }

  const patchRow = (key: string, fields: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...fields } : r)))

  const addFiles = (files: File[]) =>
    setRows((rs) => [
      ...rs,
      ...files.map((file) => ({
        key: `${file.name}-${Date.now()}-${Math.random()}`,
        file,
        status: 'idle' as const
      }))
    ])

  const startEmbedding = async (key: string, docId: string) => {
    const response = await createVectorEmbedding(docId)

    patchRow(key, {
      docId,
      error: response.ok ? undefined : 'Indexing could not start — retry'
    })
    await fetchDocumentsForArea(area.id)
  }

  /** Client half of the pipeline: extract cover → Firebase → create + embed.
   *  From then on the row's status comes from the document store. */
  const runRow = async (row: Row) => {
    patchRow(row.key, { status: 'uploading', error: undefined })

    try {
      const meta = await extractEpubMetadata(row.file)

      if (!meta.coverImage) throw new Error('No cover image found in EPUB')

      const fileMeta = await uploadFile(
        row.file,
        `epubs/${noSpaceFilename(row.file.name)}`
      )
      const coverMeta = await uploadCover(row.file, meta.coverImage)

      const created = await createDocument({
        title: meta.metadata.title ?? fileMeta.name,
        areaId: area.id,
        description: meta.metadata.description || meta.metadata.title || '',
        filePath: fileMeta.fullPath,
        fileSize: fileMeta.size,
        coverImage: createPersistentDownloadUrl(coverMeta),
        author: meta.metadata.creator
      })

      await startEmbedding(row.key, created.id)
    } catch (err) {
      logger.error({ err }, 'EPUB upload failed')
      patchRow(row.key, {
        status: 'idle',
        error: err instanceof Error ? err.message : 'Upload failed'
      })
    }
  }

  const start = async () => {
    setRunning(true)

    try {
      const queued = rows.filter((r) => r.status === 'idle' && !r.error)

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

  const retry = (row: Row) =>
    row.docId ? startEmbedding(row.key, row.docId) : runRow(row)

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

  const queuedCount = rows.filter((r) => statusOf(r) === 'idle').length
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
          <Dropzone onFiles={addFiles} />
          <div className="uplist">
            {rows.map((row) => (
              <UploadRow
                key={row.key}
                fileName={row.file.name}
                fileSize={row.file.size}
                status={statusOf(row)}
                label={labelOf(row)}
                uploadPct={uploadProgress}
                onRetry={() => retry(row)}
                onRemove={() =>
                  setRows((rs) => rs.filter((r) => r.key !== row.key))
                }
              />
            ))}
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
