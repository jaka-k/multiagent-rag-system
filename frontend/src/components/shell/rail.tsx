'use client'

import { BookCover } from '@components/shell/book-cover'
import useAreaStore from '@context/area-store.tsx'
import useDocumentStore from '@context/document-store.tsx'
import { signOut } from '@lib/session/auth.ts'
import { FileUpload } from '@ui/dashboard/file-upload'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@ui/dialog'
import { Tabs } from '@ui/tabs'
import {
  BookOpen,
  ChevronsUpDown,
  GraduationCap,
  LogOut,
  Plus
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import React from 'react'

const AREA_DOT_COLORS = ['#9A80FF', '#33A1FF', '#1CC07E', '#FF8038', '#F2576B']

export function areaDotColor(areaId: string): string {
  let h = 0

  for (let i = 0; i < areaId.length; i += 1)
    h = (h * 31 + areaId.charCodeAt(i)) % 1_000_000_007

  return AREA_DOT_COLORS[h % AREA_DOT_COLORS.length]
}

export default function Rail() {
  const router = useRouter()
  const { areas, activeArea, setActiveArea, fetchAreas } = useAreaStore()
  const { documentsByArea, fetchDocumentsForArea } = useDocumentStore()
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    fetchAreas()
  }, [fetchAreas])

  React.useEffect(() => {
    if (activeArea) fetchDocumentsForArea(activeArea.id)
  }, [activeArea, fetchDocumentsForArea])

  // Zustand-persist state differs between SSR and the hydrated client
  if (!mounted) return <nav className="rail" />

  const documents = activeArea
    ? Object.values(documentsByArea[activeArea.id] ?? {})
    : []

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
              background: activeArea ? areaDotColor(activeArea.id) : '#666',
              color: activeArea ? areaDotColor(activeArea.id) : '#666'
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
                    background: areaDotColor(area.id)
                  }}
                />
                <span className="nm">{area.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="rail-section">
        <h4>Library</h4>
      </div>
      <div className="shelf scroll" style={{ flex: 1 }}>
        {documents.map((doc) => (
          <div key={doc.id} className="book">
            <BookCover title={doc.title} />
            <div className="book-meta">
              <div className="t">{doc.title}</div>
              <div className="a">{doc.author ?? '—'}</div>
            </div>
            {doc.embeddingStatus === 'completed' && (
              <span className="book-dot" title="Indexed" />
            )}
          </div>
        ))}
        {documents.length === 0 && (
          <div className="empty-hint" style={{ color: 'var(--rail-fg-dim)' }}>
            No books yet
          </div>
        )}
      </div>

      <Dialog>
        <DialogTrigger asChild>
          <button type="button" className="upload">
            <BookOpen size={15} />
            Add a book (EPUB)
          </button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl">
          <DialogTitle>Add a book</DialogTitle>
          {/* FileUpload renders its own TabsContent; give it a Tabs context */}
          <Tabs defaultValue="File Upload">
            <FileUpload />
          </Tabs>
        </DialogContent>
      </Dialog>

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
    </nav>
  )
}
