import { PDFDocument } from 'pdf-lib'
import { getState, logOp, makeDoc, mutateDocs, undoLast } from './store'
import type { StaplerDoc } from './store'
import { extractPageTexts } from './pdf'

/** Finds a loaded document by name (case-insensitive, ".pdf" optional). */
export function findDoc(name: string): StaplerDoc {
  const { docs } = getState()
  const wanted = name.trim().toLowerCase()
  const doc = docs.find((d) => {
    const n = d.name.toLowerCase()
    return n === wanted || n === `${wanted}.pdf` || n.replace(/\.pdf$/, '') === wanted
  })
  if (!doc) {
    const available = docs.map((d) => `"${d.name}"`).join(', ') || 'none'
    throw new Error(`No document named "${name}". Available documents: ${available}.`)
  }
  return doc
}

/**
 * Parses a 1-indexed page spec like "4-7" or "1,3,5-7" into page numbers,
 * validated against the document's page count.
 */
export function parsePageSpec(spec: string, pageCount: number): number[] {
  const pages: number[] = []
  for (const part of spec.split(',')) {
    const piece = part.trim()
    if (!piece) continue
    const range = piece.match(/^(\d+)\s*-\s*(\d+)$/)
    if (range) {
      const from = Number(range[1])
      const to = Number(range[2])
      if (from > to) throw new Error(`Invalid range "${piece}": start is after end.`)
      for (let p = from; p <= to; p++) pages.push(p)
    } else if (/^\d+$/.test(piece)) {
      pages.push(Number(piece))
    } else {
      throw new Error(`Invalid page spec "${piece}". Use pages and ranges like "1,3,5-7".`)
    }
  }
  if (pages.length === 0) throw new Error('No pages specified.')
  for (const p of pages) {
    if (p < 1 || p > pageCount) {
      throw new Error(`Page ${p} is out of range — the document has ${pageCount} pages.`)
    }
  }
  return pages
}

// Page texts never change for a given doc id (rename keeps id and bytes).
const pageTextCache = new Map<string, string[]>()

/** Per-page text of a document, extracted with pdf.js and cached. */
export async function inspectDocument(name: string): Promise<{ doc: StaplerDoc; pages: string[] }> {
  const doc = findDoc(name)
  let pages = pageTextCache.get(doc.id)
  if (!pages) {
    pages = await extractPageTexts(doc.bytes)
    pageTextCache.set(doc.id, pages)
  }
  return { doc, pages }
}

function ensurePdfName(name: string): string {
  const clean = name.trim().replace(/[\\/]/g, '-')
  return clean.toLowerCase().endsWith('.pdf') ? clean : `${clean}.pdf`
}

/** Copies the given 1-indexed pages into a new document in the workspace. */
export async function extractPages(name: string, spec: string, outputName?: string): Promise<StaplerDoc> {
  const source = findDoc(name)
  const pages = parsePageSpec(spec, source.pageCount)
  const src = await PDFDocument.load(source.bytes, { ignoreEncryption: true })
  const out = await PDFDocument.create()
  const copied = await out.copyPages(src, pages.map((p) => p - 1))
  for (const page of copied) out.addPage(page)
  const bytes = await out.save()
  const newName = ensurePdfName(outputName ?? `${source.name.replace(/\.pdf$/i, '')} (pages ${spec}).pdf`)
  const doc = makeDoc(newName, bytes, pages.length)
  mutateDocs([...getState().docs, doc], `Extracted pages ${spec} of "${source.name}" → "${newName}"`)
  return doc
}

/** Merges the named documents, in order, into a new document in the workspace. */
export async function mergeDocuments(names: string[], outputName?: string): Promise<StaplerDoc> {
  if (names.length < 2) throw new Error('Merging needs at least two documents.')
  const sources = names.map(findDoc)
  const out = await PDFDocument.create()
  for (const source of sources) {
    const src = await PDFDocument.load(source.bytes, { ignoreEncryption: true })
    const copied = await out.copyPages(src, src.getPageIndices())
    for (const page of copied) out.addPage(page)
  }
  const bytes = await out.save()
  const newName = ensurePdfName(outputName ?? 'merged.pdf')
  const doc = makeDoc(newName, bytes, out.getPageCount())
  mutateDocs(
    [...getState().docs, doc],
    `Merged ${sources.map((s) => `"${s.name}"`).join(' + ')} → "${newName}"`,
  )
  return doc
}

/** Renames a document in the workspace. */
export function renameDocument(name: string, newName: string): StaplerDoc {
  const doc = findDoc(name)
  const finalName = ensurePdfName(newName)
  const renamed = { ...doc, name: finalName }
  mutateDocs(
    getState().docs.map((d) => (d.id === doc.id ? renamed : d)),
    `Renamed "${doc.name}" → "${finalName}"`,
  )
  return renamed
}

/** Downloads a document to the user's machine. */
export function exportDocument(name: string): StaplerDoc {
  const doc = findDoc(name)
  const copy = doc.bytes.slice()
  const blob = new Blob([copy.buffer as ArrayBuffer], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = doc.name
  link.click()
  URL.revokeObjectURL(url)
  // Export doesn't change the workspace, so no undo snapshot — just log it.
  logOp(`Exported "${doc.name}" to downloads`)
  return doc
}

/** Reverts the last workspace mutation. Returns false if nothing to undo. */
export function undoLastOperation(): boolean {
  return undoLast()
}
