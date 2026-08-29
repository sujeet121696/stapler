import { getState } from './store'
import {
  exportDocument,
  extractPages,
  inspectDocument,
  mergeDocuments,
  renameDocument,
  undoLastOperation,
} from './ops'

export function isWebMcpAvailable(): boolean {
  return typeof document !== 'undefined' && !!document.modelContext
}

// Execute results are plain serializable values (WebMCP spec / Site tools
// docs) — a string is delivered to the agent as-is.
function errorText(err: unknown): string {
  return `Error: ${err instanceof Error ? err.message : String(err)}`
}

// Per-page cap keeps inspect output bounded on huge real-world PDFs while
// leaving typical pages untruncated (the sample statement peaks at ~600 chars;
// a 500 cap once hid the salary lines from the agent).
const PAGE_TEXT_LIMIT = 2000

/**
 * Registers all Stapler tools with the browser's model context.
 * Returns a cleanup function that unregisters everything.
 */
export function registerStaplerTools(): () => void {
  const mc = document.modelContext
  if (!mc) return () => {}

  const controller = new AbortController()
  const options = { signal: controller.signal }

  mc.registerTool(
    {
      name: 'list_documents',
      title: 'List documents',
      description:
        'List every document currently loaded in the Stapler workspace, with name, page count and file size. ' +
        'Call this first to see what documents are available before doing anything else.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true },
      execute: async () => {
        const { docs } = getState()
        if (docs.length === 0) {
          return (
            'No documents are loaded yet. Ask the user to drop PDF files onto the page ' +
            'or click "Load sample documents".'
          )
        }
        const lines = docs.map(
          (d) => `- "${d.name}" — ${d.pageCount} pages, ${(d.bytes.length / 1024).toFixed(0)} KB`,
        )
        return `${docs.length} document(s) loaded:\n${lines.join('\n')}`
      },
    },
    options,
  )

  mc.registerTool(
    {
      name: 'inspect_document',
      title: 'Inspect document',
      description:
        'Read the text of every page of a document, page by page. Use this to find which pages ' +
        'contain the information you need (for example, which pages of a bank statement show ' +
        'salary credits) before extracting or merging. Page numbers are 1-indexed.',
      inputSchema: {
        type: 'object',
        properties: {
          document: { type: 'string', description: 'Name of a loaded document, e.g. "bank-statement.pdf".' },
        },
        required: ['document'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      execute: async (input) => {
        const { document: name } = input as { document: string }
        try {
          const { doc, pages } = await inspectDocument(name)
          const body = pages
            .map((t, i) => {
              const trimmed =
                t.length > PAGE_TEXT_LIMIT ? `${t.slice(0, PAGE_TEXT_LIMIT)} [...truncated]` : t
              return `--- Page ${i + 1} of ${pages.length} ---\n${trimmed || '(no extractable text on this page)'}`
            })
            .join('\n')
          return `Contents of "${doc.name}" (${pages.length} pages):\n${body}`
        } catch (err) {
          return errorText(err)
        }
      },
    },
    options,
  )

  mc.registerTool(
    {
      name: 'extract_pages',
      title: 'Extract pages',
      description:
        'Copy specific pages out of a document into a new document in the workspace. ' +
        'The source document is not modified. Use inspect_document first to find the right pages.',
      inputSchema: {
        type: 'object',
        properties: {
          document: { type: 'string', description: 'Name of the source document.' },
          pages: {
            type: 'string',
            description: '1-indexed pages and ranges, e.g. "4-7" or "1,3,5-7".',
          },
          output_name: {
            type: 'string',
            description: 'Optional name for the new document. Defaults to "<source> (pages ...)".',
          },
        },
        required: ['document', 'pages'],
        additionalProperties: false,
      },
      execute: async (input) => {
        const args = input as { document: string; pages: string; output_name?: string }
        try {
          const doc = await extractPages(args.document, args.pages, args.output_name)
          return `Created "${doc.name}" with ${doc.pageCount} page(s).`
        } catch (err) {
          return errorText(err)
        }
      },
    },
    options,
  )

  mc.registerTool(
    {
      name: 'merge_documents',
      title: 'Merge documents',
      description:
        'Combine two or more documents, in the order given, into a single new document in the workspace. ' +
        'The source documents are not modified.',
      inputSchema: {
        type: 'object',
        properties: {
          documents: {
            type: 'array',
            items: { type: 'string' },
            minItems: 2,
            description: 'Names of the documents to merge, in the desired page order.',
          },
          output_name: { type: 'string', description: 'Name for the merged document.' },
        },
        required: ['documents', 'output_name'],
        additionalProperties: false,
      },
      execute: async (input) => {
        const args = input as { documents: string[]; output_name: string }
        try {
          const doc = await mergeDocuments(args.documents, args.output_name)
          return `Created "${doc.name}" with ${doc.pageCount} page(s).`
        } catch (err) {
          return errorText(err)
        }
      },
    },
    options,
  )

  mc.registerTool(
    {
      name: 'rename_document',
      title: 'Rename document',
      description: 'Rename a document in the workspace. A ".pdf" extension is added if missing.',
      inputSchema: {
        type: 'object',
        properties: {
          document: { type: 'string', description: 'Current name of the document.' },
          new_name: { type: 'string', description: 'New name for the document.' },
        },
        required: ['document', 'new_name'],
        additionalProperties: false,
      },
      execute: async (input) => {
        const args = input as { document: string; new_name: string }
        try {
          const doc = renameDocument(args.document, args.new_name)
          return `Renamed to "${doc.name}".`
        } catch (err) {
          return errorText(err)
        }
      },
    },
    options,
  )

  mc.registerTool(
    {
      name: 'export_document',
      title: 'Export document',
      description:
        "Download a document from the workspace to the user's machine as a PDF file. " +
        'Use this as the final step once the requested document is ready.',
      inputSchema: {
        type: 'object',
        properties: {
          document: { type: 'string', description: 'Name of the document to download.' },
        },
        required: ['document'],
        additionalProperties: false,
      },
      execute: async (input) => {
        const { document: name } = input as { document: string }
        try {
          const doc = exportDocument(name)
          return `"${doc.name}" was downloaded to the user's machine.`
        } catch (err) {
          return errorText(err)
        }
      },
    },
    options,
  )

  mc.registerTool(
    {
      name: 'undo',
      title: 'Undo last operation',
      description:
        'Revert the most recent workspace change (extract, merge or rename). ' +
        'Use this if an operation produced the wrong result.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      execute: async () => {
        return undoLastOperation() ? 'The last operation was undone.' : 'Nothing to undo.'
      },
    },
    options,
  )

  return () => controller.abort()
}
