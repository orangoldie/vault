import posthog from "posthog-js"

if (typeof window !== "undefined" && window.location.hostname !== "localhost") {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    defaults: "2026-01-30",
  })
}
