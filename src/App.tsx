import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'
import { addDoc, useStapler } from './store'
import { readPdf } from './pdf'
import { isWebMcpAvailable, registerStaplerTools } from './webmcp'
import { loadSampleDocuments } from './samples'

export default function App() {
  const { docs, opLog } = useStapler()
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadingSamples, setLoadingSamples] = useState(false)
  const [preview, setPreview] = useState<{ name: string; url: string } | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const webMcpOn = isWebMcpAvailable()

  useEffect(() => registerStaplerTools(), [])

  const openPreview = useCallback((doc: { name: string; bytes: Uint8Array }) => {
    // .slice() copies to a plain ArrayBuffer-backed view (BlobPart-compatible)
    const url = URL.createObjectURL(new Blob([doc.bytes.slice()], { type: 'application/pdf' }))
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev.url)
      return { name: doc.name, url }
    })
  }, [])

  const closePreview = useCallback(() => {
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev.url)
      return null
    })
  }, [])

  useEffect(() => {
    if (!preview) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePreview()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [preview, closePreview])

  const onFiles = useCallback(async (files: Iterable<File>) => {
    setError(null)
    // Snapshot before any await — FileList/DataTransfer entries are gone once the event ends
    const picked = Array.from(files)
    for (const file of picked) {
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setError(`"${file.name}" skipped — only PDF files for now.`)
        continue
      }
      try {
        const { bytes, pageCount } = await readPdf(file)
        addDoc(file.name, bytes, pageCount)
      } catch {
        setError(`Could not read "${file.name}" — is it a valid PDF?`)
      }
    }
  }, [])

  return (
    <div className="app">
      <header>
        <h1>
          📎 Stapler
          <span className={`badge ${webMcpOn ? 'on' : 'off'}`}>
            {webMcpOn ? 'agent-ready' : 'WebMCP not available'}
          </span>
        </h1>
        <p className="tagline">
          An AI agent preps your documents right in your browser via WebMCP — it finds the
          right pages itself, merges and downloads. Your files never leave your device.
        </p>
      </header>

      <main>
        <section className="workspace">
          <div
            className={`dropzone ${dragOver ? 'over' : ''}`}
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragOver(false)
              void onFiles(e.dataTransfer.files)
            }}
            onClick={() => fileInput.current?.click()}
          >
            <p>Drop PDF files here, or click to choose</p>
            <input
              ref={fileInput}
              type="file"
              accept="application/pdf"
              multiple
              hidden
              onChange={(e) => {
                if (e.target.files) void onFiles(e.target.files)
                e.target.value = ''
              }}
            />
          </div>

          {docs.length === 0 && (
            <button
              className="sample-btn"
              disabled={loadingSamples}
              onClick={async () => {
                setLoadingSamples(true)
                try {
                  await loadSampleDocuments()
                } finally {
                  setLoadingSamples(false)
                }
              }}
            >
              {loadingSamples ? 'Generating…' : 'Load sample documents (fictional visa scenario)'}
            </button>
          )}

          {error && <p className="error">{error}</p>}

          <ul className="doc-list">
            {docs.map((doc) => (
              <li
                key={doc.id}
                className="doc-card"
                role="button"
                tabIndex={0}
                title="Click to preview"
                onClick={() => openPreview(doc)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    openPreview(doc)
                  }
                }}
              >
                <span className="doc-name">{doc.name}</span>
                <span className="doc-meta">
                  {doc.pageCount} page{doc.pageCount === 1 ? '' : 's'} ·{' '}
                  {(doc.bytes.length / 1024).toFixed(0)} KB
                </span>
              </li>
            ))}
          </ul>
        </section>

        <aside className="oplog">
          <h2>Operations</h2>
          {opLog.length === 0 ? (
            <p className="empty">Nothing yet — every action by you or the agent shows up here.</p>
          ) : (
            <ol>
              {opLog.map((op) => (
                <li key={op.id}>
                  <span className="op-time">{op.at}</span> {op.label}
                </li>
              ))}
            </ol>
          )}
        </aside>
      </main>

      {preview && (
        <div className="preview-overlay" onClick={closePreview}>
          <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="preview-header">
              <span className="doc-name">{preview.name}</span>
              <button className="preview-close" onClick={closePreview} aria-label="Close preview">
                ×
              </button>
            </div>
            <iframe className="preview-frame" src={preview.url} title={preview.name} />
          </div>
        </div>
      )}
    </div>
  )
}
