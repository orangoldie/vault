import { ImportFlow } from "@/features/import/components/import-flow"

export default function ImportPage() {
  return (
    <main className="flex min-h-svh items-center justify-center px-6 py-12">
      <div className="w-full max-w-[480px]">
        <ImportFlow />
      </div>
    </main>
  )
}
