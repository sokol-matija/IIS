import "@testing-library/jest-dom"
import { vi } from "vitest"

// Node v25 has a built-in localStorage stub (without methods like setItem/getItem/clear)
// that shadows jsdom's proper localStorage in test workers.
// We replace it with a proper in-memory implementation.
const createLocalStorageMock = () => {
  let store: Record<string, string> = {}
  return {
    getItem(key: string): string | null {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null
    },
    setItem(key: string, value: string): void {
      store[key] = String(value)
    },
    removeItem(key: string): void {
      delete store[key]
    },
    clear(): void {
      store = {}
    },
    get length(): number {
      return Object.keys(store).length
    },
    key(index: number): string | null {
      return Object.keys(store)[index] ?? null
    },
  }
}

const localStorageMock = createLocalStorageMock()
vi.stubGlobal("localStorage", localStorageMock)
