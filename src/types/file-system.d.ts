/**
 * Augments TypeScript's built-in DOM types with File System Access API
 * methods that browsers support but lib.dom.d.ts doesn't include yet.
 */

interface FileSystemDirectoryHandle {
  keys(): AsyncIterableIterator<string>
  values(): AsyncIterableIterator<FileSystemHandle>
  entries(): AsyncIterableIterator<[string, FileSystemHandle]>
  [Symbol.asyncIterator](): AsyncIterableIterator<[string, FileSystemHandle]>
}

interface FileSystemWritableFileStream {
  write(data: Uint8Array): Promise<void>
}
