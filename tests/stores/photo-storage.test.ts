import { describe, it, expect, beforeEach, vi } from "vitest"

import {
  writePhoto,
  readPhoto,
  deletePhotosByTrip,
  deletePhotoFiles,
  resetPhotosRoot,
} from "@/stores/photo-storage"

// In-memory OPFS mock
class MockFileSystemWritableFileStream {
  private handle: MockFileSystemFileHandle

  constructor(handle: MockFileSystemFileHandle) {
    this.handle = handle
  }

  async write(data: BufferSource | Blob | string): Promise<void> {
    if (data instanceof Uint8Array) {
      this.handle._data = new Blob([data])
    } else if (data instanceof Blob) {
      this.handle._data = data
    } else {
      this.handle._data = new Blob([data as string])
    }
  }

  async close(): Promise<void> {
    // no-op
  }
}

class MockFileSystemFileHandle {
  readonly kind = "file" as const
  readonly name: string
  _data: Blob = new Blob()

  constructor(name: string) {
    this.name = name
  }

  async getFile(): Promise<File> {
    return new File([this._data], this.name)
  }

  async createWritable(): Promise<MockFileSystemWritableFileStream> {
    return new MockFileSystemWritableFileStream(this)
  }
}

class MockFileSystemDirectoryHandle {
  readonly kind = "directory" as const
  readonly name: string
  private dirs = new Map<string, MockFileSystemDirectoryHandle>()
  private files = new Map<string, MockFileSystemFileHandle>()

  constructor(name: string) {
    this.name = name
  }

  async getDirectoryHandle(
    name: string,
    options?: { create?: boolean }
  ): Promise<MockFileSystemDirectoryHandle> {
    let dir = this.dirs.get(name)
    if (!dir) {
      if (options?.create) {
        dir = new MockFileSystemDirectoryHandle(name)
        this.dirs.set(name, dir)
      } else {
        throw new DOMException("Not found", "NotFoundError")
      }
    }
    return dir
  }

  async getFileHandle(
    name: string,
    options?: { create?: boolean }
  ): Promise<MockFileSystemFileHandle> {
    let file = this.files.get(name)
    if (!file) {
      if (options?.create) {
        file = new MockFileSystemFileHandle(name)
        this.files.set(name, file)
      } else {
        throw new DOMException("Not found", "NotFoundError")
      }
    }
    return file
  }

  async removeEntry(name: string, _options?: { recursive?: boolean }): Promise<void> {
    const hadDir = this.dirs.delete(name)
    const hadFile = this.files.delete(name)
    if (!hadDir && !hadFile) {
      throw new DOMException("Not found", "NotFoundError")
    }
  }
}

let mockRoot: MockFileSystemDirectoryHandle

beforeEach(() => {
  resetPhotosRoot()
  mockRoot = new MockFileSystemDirectoryHandle("root")

  // Mock navigator.storage.getDirectory
  Object.defineProperty(navigator, "storage", {
    value: {
      getDirectory: vi.fn().mockResolvedValue(mockRoot),
    },
    writable: true,
    configurable: true,
  })
})

describe("photo-storage", () => {
  it("writes and reads a photo", async () => {
    const data = new Uint8Array([0xff, 0xd8, 0xff, 0xe0])
    await writePhoto(1, 100, "photo.jpg", data)

    const blob = await readPhoto(1, 100, "photo.jpg")
    expect(blob).not.toBeNull()
    expect(blob!.size).toBeGreaterThan(0)
  })

  it("returns null for a missing photo", async () => {
    const blob = await readPhoto(999, 999, "nope.jpg")
    expect(blob).toBeNull()
  })

  it("deletes all photos for a trip", async () => {
    await writePhoto(1, 100, "a.jpg", new Uint8Array([1]))
    await writePhoto(1, 101, "b.jpg", new Uint8Array([2]))

    await deletePhotosByTrip(1)

    const blobA = await readPhoto(1, 100, "a.jpg")
    const blobB = await readPhoto(1, 101, "b.jpg")
    expect(blobA).toBeNull()
    expect(blobB).toBeNull()
  })

  it("does not throw when deleting a non-existent trip", async () => {
    await expect(deletePhotosByTrip(999)).resolves.toBeUndefined()
  })

  it("deletes specific photo files", async () => {
    await writePhoto(1, 100, "a.jpg", new Uint8Array([1]))
    await writePhoto(1, 100, "b.jpg", new Uint8Array([2]))

    await deletePhotoFiles([{ tripId: 1, stepId: 100, filename: "a.jpg" }])

    const blobA = await readPhoto(1, 100, "a.jpg")
    const blobB = await readPhoto(1, 100, "b.jpg")
    expect(blobA).toBeNull()
    expect(blobB).not.toBeNull()
  })

  it("does not throw when deleting non-existent files", async () => {
    await expect(
      deletePhotoFiles([{ tripId: 999, stepId: 999, filename: "nope.jpg" }])
    ).resolves.toBeUndefined()
  })

  it("overwrites an existing photo file", async () => {
    const original = new Uint8Array([1, 2, 3])
    const updated = new Uint8Array([4, 5, 6, 7])

    await writePhoto(1, 100, "photo.jpg", original)
    await writePhoto(1, 100, "photo.jpg", updated)

    const blob = await readPhoto(1, 100, "photo.jpg")
    expect(blob).not.toBeNull()
    expect(blob!.size).toBe(updated.length)
  })

  it("isolates photos across different trips", async () => {
    await writePhoto(1, 100, "photo.jpg", new Uint8Array([1]))
    await writePhoto(2, 200, "photo.jpg", new Uint8Array([2]))

    await deletePhotosByTrip(1)

    const blob1 = await readPhoto(1, 100, "photo.jpg")
    const blob2 = await readPhoto(2, 200, "photo.jpg")
    expect(blob1).toBeNull()
    expect(blob2).not.toBeNull()
  })

  it("isolates photos across different steps in the same trip", async () => {
    await writePhoto(1, 100, "photo.jpg", new Uint8Array([1]))
    await writePhoto(1, 101, "photo.jpg", new Uint8Array([2]))

    await deletePhotoFiles([{ tripId: 1, stepId: 100, filename: "photo.jpg" }])

    const blob100 = await readPhoto(1, 100, "photo.jpg")
    const blob101 = await readPhoto(1, 101, "photo.jpg")
    expect(blob100).toBeNull()
    expect(blob101).not.toBeNull()
  })
})
