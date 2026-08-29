// Smoke test (run with: npm run smoke)
// Generates the sample documents and verifies the demo premise:
// every page has extractable text, and salary credits appear on
// pages 4-7 of the bank statement and nowhere else.
import { loadSampleDocuments } from '../src/samples'
import { getState } from '../src/store'
// Node build of pdf.js — no worker needed here
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'

async function pageTexts(bytes: Uint8Array): Promise<string[]> {
  const task = getDocument({ data: bytes.slice() })
  const pdf = await task.promise
  const texts: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    texts.push(content.items.map((it) => ('str' in it ? it.str : '')).join(' '))
  }
  await task.destroy()
  return texts
}

await loadSampleDocuments()
const { docs } = getState()
console.log(
  'Docs loaded:',
  docs.map((d) => `${d.name} (${d.pageCount}p, ${(d.bytes.length / 1024).toFixed(0)}KB)`),
)

const statement = docs.find((d) => d.name.includes('bank-statement'))
if (!statement) throw new Error('bank statement missing')

const pages = await pageTexts(statement.bytes)
if (pages.length !== 12) throw new Error(`expected 12 pages, got ${pages.length}`)

// Must stay below PAGE_TEXT_LIMIT in webmcp.ts, or inspect_document
// truncation hides page content from the agent (bit us at 500).
const INSPECT_LIMIT = 2000

const salaryPages: number[] = []
pages.forEach((text, i) => {
  if (text.length < 20) throw new Error(`page ${i + 1} has no extractable text`)
  if (text.length >= INSPECT_LIMIT)
    throw new Error(`page ${i + 1} (${text.length} chars) would be truncated by inspect_document`)
  // The demo premise needs ONE right answer: no income-like lines outside 4-7
  // (a FREELANCE INVOICE credit on the Jan page once lured the agent into 3-7).
  if (/FREELANCE|INVOICE|WAGES|PAYROLL/.test(text))
    throw new Error(`page ${i + 1} contains an income-like line that competes with SALARY CREDIT`)
  if (text.includes('SALARY CREDIT')) salaryPages.push(i + 1)
})

console.log('Salary credit pages:', salaryPages)
if (salaryPages.join(',') !== '4,5,6,7') throw new Error('salary pages are not exactly 4-7!')

for (const partial of ['passport', 'visa-application']) {
  const doc = docs.find((d) => d.name.includes(partial))
  if (!doc) throw new Error(`${partial} missing`)
  const [first] = await pageTexts(doc.bytes)
  if (!first.includes('KUMAR')) throw new Error(`${doc.name}: expected text not found`)
}

console.log('SMOKE TEST PASSED — salary credits on pages 4-7 only, all pages have text.')
