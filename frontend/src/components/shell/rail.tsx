'use client'

import { BookRow } from '@components/shell/book-row'
import useAreaStore from '@context/area-store.tsx'
import useDocumentStore from '@context/document-store.tsx'
import { useToast } from '@hooks/use-toast'
import { createArea } from '@lib/fetchers/fetch-areas.ts'
import { signOut } from '@lib/session/auth.ts'
import { NewAreaDialog } from '@ui/areas/new-area-dialog'
import { UploadDialog } from '@ui/upload/upload-dialog'
import {
  BookOpen,
  ChevronsUpDown,
  GraduationCap,
  LogOut,
  Plus
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import React from 'react'

export default function Rail() {
  const router = useRouter()
  const { toast } = useToast()
  const { areas, activeArea, setActiveArea, fetchAreas, addArea } =
    useAreaStore()
  const { documentsByArea, fetchDocumentsForArea } = useDocumentStore()
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [areaDialogOpen, setAreaDialogOpen] = React.useState(false)
  const [uploadOpen, setUploadOpen] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    fetchAreas()
  }, [fetchAreas])

  React.useEffect(() => {
    if (activeArea) fetchDocumentsForArea(activeArea.id)
  }, [activeArea, fetchDocumentsForArea])

  // Indexing runs server-side after upload; poll while any book is in flight
  // so the shelf states stay live even with the dialog closed.
  const anyIndexing = Object.values(
    (activeArea && documentsByArea[activeArea.id]) || {}
  ).some((d) => ['processing', 'embedding'].includes(d.embeddingStatus))

  React.useEffect(() => {
    if (!anyIndexing || !activeArea) return undefined

    const timer = setInterval(() => fetchDocumentsForArea(activeArea.id), 2500)

    return () => clearInterval(timer)
  }, [anyIndexing, activeArea, fetchDocumentsForArea])

  // Zustand-persist state differs between SSR and the hydrated client
  if (!mounted) return <nav className="rail" />

  const documents = activeArea
    ? Object.values(documentsByArea[activeArea.id] ?? {})
    : []

  const handleCreateArea = async (name: string, color: string) => {
    const created = await createArea(name, color)

    if (!created) {
      toast({
        title: 'Area not created ⛔️',
        description: 'We encountered an internal error creating your area.'
      })
      return
    }

    addArea({ ...created, documents: [] })
    setActiveArea(created.id)
    setAreaDialogOpen(false)
  }

  return (
    <nav className="rail">
      <div className="rail-top">
        <div className="brand">
          <div className="brand-mark">
            <GraduationCap size={18} />
          </div>
          <span className="brand-name">
            M<b>RAG</b>
          </span>
        </div>
      </div>

      <div className="rail-area">
        <div className="area-eyebrow">Area</div>
        <button
          type="button"
          className="area-switch"
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span
            className="adot"
            style={{
              borderRadius: '50%',
              background: activeArea?.color ?? '#666',
              color: activeArea?.color ?? '#666'
            }}
          />
          <span className="as-name">{activeArea?.name ?? 'No area'}</span>
          <span className="as-count">{documents.length} books</span>
          <span className="ic">
            <ChevronsUpDown size={14} />
          </span>
        </button>

        {menuOpen && (
          <div className="area-menu">
            {areas.map((area) => (
              <button
                key={area.id}
                type="button"
                className={
                  area.id === activeArea?.id ? 'area-opt on' : 'area-opt'
                }
                onClick={() => {
                  setActiveArea(area.id)
                  setMenuOpen(false)
                }}
              >
                <span
                  className="adot"
                  style={{
                    borderRadius: '50%',
                    background: area.color
                  }}
                />
                <span className="nm">{area.name}</span>
              </button>
            ))}
            <div className="area-menu-foot">
              <button
                type="button"
                className="area-new"
                onClick={() => {
                  setMenuOpen(false)
                  setAreaDialogOpen(true)
                }}
              >
                <Plus size={15} /> New area
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="rail-section">
        <h4>Library</h4>
        <button
          type="button"
          className="add"
          title="Add book"
          onClick={() => setUploadOpen(true)}
        >
          <Plus size={14} />
        </button>
      </div>
      <div className="shelf scroll" style={{ flex: 1 }}>
        {documents.map((doc) => (
          <BookRow
            key={doc.id}
            doc={doc}
            onRetried={() => activeArea && fetchDocumentsForArea(activeArea.id)}
          />
        ))}
        {documents.length === 0 && (
          <div className="empty-hint" style={{ color: 'var(--rail-fg-dim)' }}>
            No books yet
          </div>
        )}
        <button
          type="button"
          className="upload"
          onClick={() => setUploadOpen(true)}
        >
          <BookOpen size={15} />
          Add a book (EPUB)
        </button>
      </div>

      <div className="rail-foot">
        <button
          type="button"
          className="user"
          onClick={() => {
            signOut()
            router.push('/login')
          }}
        >
          <div className="avatar">
            <Plus size={15} style={{ display: 'none' }} />U
          </div>
          <div>
            <div className="nm">Account</div>
            <div className="pl">Sign out</div>
          </div>
          <span className="ic">
            <LogOut size={15} />
          </span>
        </button>
      </div>

      {areaDialogOpen && (
        <NewAreaDialog
          onClose={() => setAreaDialogOpen(false)}
          onCreate={handleCreateArea}
        />
      )}
      {uploadOpen && activeArea && (
        <UploadDialog area={activeArea} onClose={() => setUploadOpen(false)} />
      )}
    </nav>
  )
}
