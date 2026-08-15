'use client'

import { Upload } from 'lucide-react'
import React from 'react'

export function isEpub(file: File): boolean {
  return file.name.toLowerCase().endsWith('.epub')
}

/** Drag-and-drop + browse target for EPUB files. */
export function Dropzone({ onFiles }: { onFiles: (files: File[]) => void }) {
  const [dragging, setDragging] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const accept = (files: FileList) => onFiles(Array.from(files).filter(isEpub))

  return (
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
        accept(e.dataTransfer.files)
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
          if (e.target.files) accept(e.target.files)
          e.target.value = ''
        }}
      />
    </div>
  )
}
