"use client"

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react"
import type { ReactNode } from "react"

interface OverlayContext {
  active: boolean
  /** Call with a unique key when opening a fullscreen overlay. */
  acquire(key: string): void
  /** Call with the same key when closing. */
  release(key: string): void
}

const Ctx = createContext<OverlayContext>({
  active: false,
  acquire: () => {},
  release: () => {},
})

export function useOverlayActive(): boolean {
  return useContext(Ctx).active
}

export function useOverlay(key: string) {
  const { acquire, release } = useContext(Ctx)
  return useMemo(
    () => ({
      acquire: () => acquire(key),
      release: () => release(key),
    }),
    [acquire, release, key]
  )
}

export function OverlayProvider({ children }: { children: ReactNode }) {
  const keysRef = useRef(new Set<string>())
  const [active, setActive] = useState(false)

  const acquire = useCallback((key: string) => {
    keysRef.current.add(key)
    setActive(true)
  }, [])

  const release = useCallback((key: string) => {
    keysRef.current.delete(key)
    setActive(keysRef.current.size > 0)
  }, [])

  const value = useMemo(() => ({ active, acquire, release }), [active, acquire, release])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
