import { getState, subscribe } from './store'
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
 * Registers the Stapler tools with the browser's model context and keeps the
 * registrations in sync with the workspace: document parameters are enums of
 * the currently loaded filenames (the agent can't reference a wrong file),
 * document tools appear once files are loaded, and merge_documents only when
 * there are at least two. Returns a cleanup function that unregisters
 * everything and stops syncing.
 */
export function registerStaplerTools(): () => void {
  const mc = document.modelContext
  if (!mc) return () => {}

  let controller: AbortController | null = null
  let registeredFor: string | null = null
  let disposed = false
  let scheduled = false

  const register = () => {
    const { docs } = getState()
    // Re-register only when the schemas would change (names or page counts),
    // not on every op-log entry.
    const signature = docs.map((d) => `${d.name} ${d.pageCount}`).join('\n')
    if (controller && signature === registeredFor) return
    registeredFor = signature

    controller?.abort()
    controller = new AbortController()
    const options = { signal: controller.signal }

    const names = docs.map((d) => d.name)
    const docParam = (description: string) => ({
      type: 'string',
      description,
      ...(names.length > 0 ? { enum: names } : {}),
    })
    const loadedList = docs.map((d) => `"${d.name}" (${d.pageCount} pages)`).join(', ')

    mc.registerTool(
      {
        name: 'list_documents',
        title: 'List documents',
        description:
          'List every document currently loaded in the Stapler workspace, with name, page count and file size. ' +
          'Call this first to see what documents are available before doing anything else.' +
          (docs.length === 0 ? ' More document tools appear once documents are loaded.' : ''),
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

    if (docs.length > 0) {
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
              document: docParam('Name of a loaded document.'),
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
            'The source document is not modified. Use inspect_document first to find the right pages. ' +
            `Loaded: ${loadedList}.`,
          inputSchema: {
            type: 'object',
            properties: {
              document: docParam('Name of the source document.'),
              pages: {
                type: 'string',
                description: '1-indexed pages and ranges within the source document, e.g. "4-7" or "1,3,5-7".',
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
          name: 'rename_document',
          title: 'Rename document',
          description: 'Rename a document in the workspace. A ".pdf" extension is added if missing.',
          inputSchema: {
            type: 'object',
            properties: {
              document: docParam('Current name of the document.'),
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
              document: docParam('Name of the document to download.'),
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
    }

    if (docs.length >= 2) {
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
                items: docParam('Name of a loaded document.'),
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
    }

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
  }

  // Store changes are emitted synchronously from inside tool execute() calls,
  // so re-registering immediately would tear down the registration of the very
  // tool that is still delivering its result. Deferring to a macrotask lets
  // the in-flight response complete first, and coalesces bursts (multi-file
  // drops) into a single re-registration.
  const scheduleRegister = () => {
    if (scheduled || disposed) return
    scheduled = true
    setTimeout(() => {
      scheduled = false
      if (!disposed) register()
    }, 0)
  }

  register()
  const unsubscribe = subscribe(scheduleRegister)
  return () => {
    disposed = true
    unsubscribe()
    controller?.abort()
  }
}
