/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { defaultCache } from "@serwist/turbopack/worker"
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist"
import { NetworkFirst, Serwist } from "serwist"

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope

function isNavigationRequest(request: Request) {
  return (
    request.mode === "navigate" ||
    request.destination === "document" ||
    request.headers.get("accept")?.includes("text/html") === true
  )
}

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  precacheOptions: {
    cleanupOutdatedCaches: true,
    fallbackToNetwork: false,
  },
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: false,
  runtimeCaching: [
    {
      matcher: ({ request }) => isNavigationRequest(request),
      handler: new NetworkFirst({
        cacheName: "pages",
        networkTimeoutSeconds: 3,
      }),
    },
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: "/",
        matcher({ request }) {
          return isNavigationRequest(request)
        },
      },
      {
        url: "/~offline",
        matcher({ request }) {
          return isNavigationRequest(request)
        },
      },
    ],
  },
})

const urlsToWarm = ["/", "/~offline"] as const

self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all(
      urlsToWarm.map((url) =>
        serwist.handleRequest({
          request: new Request(url, { credentials: "same-origin" }),
          event,
        })
      )
    )
  )
})

serwist.addEventListeners()
