import { PDFDocument } from 'pdf-lib'
import * as pdfjs from 'pdfjs-dist'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

export async function readPdf(file: File): Promise<{ bytes: Uint8Array; pageCount: number }> {
  const bytes = new Uint8Array(await file.arrayBuffer())
  const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true })
  return { bytes, pageCount: pdf.getPageCount() }
}

/**
 * Extracts the text of every page. Returns one string per page (1-indexed
 * page N is texts[N-1]). pdf.js transfers the buffer to its worker, so we
 * pass a copy to keep the store's bytes intact.
 */
export async function extractPageTexts(bytes: Uint8Array): Promise<string[]> {
  const task = pdfjs.getDocument({ data: bytes.slice() })
  const doc = await task.promise
  try {
    const texts: string[] = []
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i)
      const content = await page.getTextContent()
      const text = content.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()
      texts.push(text)
    }
    return texts
  } finally {
    await task.destroy()
  }
}
