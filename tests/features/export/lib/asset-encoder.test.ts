import { describe, it, expect } from "vitest"

import {
  encodeUtf8,
  arrayBufferToBase64,
  buildAssetScript,
  buildFontScript,
  buildSpriteScript,
  buildWorkerScript,
} from "@/features/export-web/lib/asset-encoder"

describe("asset-encoder", () => {
  describe("encodeUtf8", () => {
    it("encodes ASCII strings to Uint8Array", () => {
      const result = encodeUtf8("hello")
      expect(result.length).toBe(5)
      expect(result[0]).toBe(104) // 'h'
      expect(result[4]).toBe(111) // 'o'
    })

    it("encodes multi-byte characters", () => {
      const result = encodeUtf8("שלום")
      expect(result.length).toBeGreaterThan(4) // Hebrew chars are multi-byte in UTF-8
    })
  })

  describe("arrayBufferToBase64", () => {
    it("encodes an ArrayBuffer to base64", () => {
      const bytes = new Uint8Array([72, 101, 108, 108, 111]) // "Hello"
      const result = arrayBufferToBase64(bytes.buffer)
      expect(result).toBe(btoa("Hello"))
    })

    it("handles empty buffer", () => {
      const result = arrayBufferToBase64(new ArrayBuffer(0))
      expect(result).toBe("")
    })

    it("round-trips binary data correctly", () => {
      const original = new Uint8Array(256)
      for (let i = 0; i < 256; i++) original[i] = i
      const b64 = arrayBufferToBase64(original.buffer)
      const decoded = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
      expect(decoded).toEqual(original)
    })
  })

  describe("buildAssetScript", () => {
    it("generates a JS assignment to __VAULT_ASSETS__", () => {
      const result = buildAssetScript("pmtiles:globe", "abc123")
      expect(result).toBe('window.__VAULT_ASSETS__["pmtiles:globe"] = "abc123";\n')
    })
  })

  describe("buildFontScript", () => {
    it("generates JS assignments for font PBF files", () => {
      const fonts = new Map<string, ArrayBuffer>()
      const data = new Uint8Array([1, 2, 3]).buffer
      fonts.set("map-assets/fonts/Noto Sans Regular/0-255.pbf", data)

      const result = buildFontScript(fonts)
      expect(result).toContain('window.__VAULT_ASSETS__["font:Noto Sans Regular/0-255.pbf"]')
      expect(result).toContain(arrayBufferToBase64(data))
    })
  })

  describe("buildSpriteScript", () => {
    it("generates JS assignments for sprite files", () => {
      const sprites = new Map<string, ArrayBuffer>()
      const data = new Uint8Array([10, 20]).buffer
      sprites.set("map-assets/sprites/light.json", data)

      const result = buildSpriteScript(sprites)
      expect(result).toContain('window.__VAULT_ASSETS__["sprite:light.json"]')
    })
  })

  describe("buildWorkerScript", () => {
    it("wraps worker source in a __VAULT_ASSETS__ assignment", () => {
      const result = buildWorkerScript("console.log('worker')")
      expect(result).toContain('window.__VAULT_ASSETS__["maplibre:worker"]')
      expect(result).toContain("console.log('worker')")
    })

    it("escapes backticks in worker source", () => {
      const result = buildWorkerScript("const x = `template`")
      // The raw backticks from the input should be escaped as \`
      expect(result).toContain("\\`template\\`")
    })
  })
})
