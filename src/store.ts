import { useSyncExternalStore } from 'react'

export interface StaplerDoc {
  id: string
  name: string
  bytes: Uint8Array
  pageCount: number
}

export interface OpLogEntry {
  id: number
  label: string
  at: string
}

interface StaplerState {
  docs: StaplerDoc[]
  opLog: OpLogEntry[]
}

let state: StaplerState = { docs: [], opLog: [] }
const listeners = new Set<() => void>()
let opId = 0
let docId = 0

function emit() {
  for (const listener of listeners) listener()
}

export function getState(): StaplerState {
  return state
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useStapler(): StaplerState {
  return useSyncExternalStore(subscribe, getState)
}

export function logOp(label: string) {
  const entry: OpLogEntry = {
    id: ++opId,
    label,
    at: new Date().toLocaleTimeString(),
  }
  state = { ...state, opLog: [...state.opLog, entry] }
  emit()
}

export function addDoc(name: string, bytes: Uint8Array, pageCount: number): StaplerDoc {
  const doc: StaplerDoc = { id: `doc-${++docId}`, name, bytes, pageCount }
  state = { ...state, docs: [...state.docs, doc] }
  logOp(`Loaded "${name}" (${pageCount} page${pageCount === 1 ? '' : 's'})`)
  return doc
}

export function makeDoc(name: string, bytes: Uint8Array, pageCount: number): StaplerDoc {
  return { id: `doc-${++docId}`, name, bytes, pageCount }
}

// --- undo ---------------------------------------------------------------
// Snapshots of the docs array taken before each mutating operation.
// StaplerDoc objects are never mutated in place, so shallow copies suffice.
const undoStack: StaplerDoc[][] = []
const UNDO_LIMIT = 25

export function mutateDocs(next: StaplerDoc[], label: string) {
  undoStack.push(state.docs)
  if (undoStack.length > UNDO_LIMIT) undoStack.shift()
  state = { ...state, docs: next }
  logOp(label)
}

export function undoLast(): boolean {
  const prev = undoStack.pop()
  if (!prev) return false
  state = { ...state, docs: prev }
  logOp('Undid last operation')
  return true
}
