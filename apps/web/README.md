# Web App

## Big picture

- The feed maintains a session-scoped queue of events with a cursor persisted across reloads.
- A one-week freshness rule prunes entries older than seven days and drives `since` timestamps in feed requests.
- Service worker caching should respect this window to avoid serving stale sessions, and telemetry logs queue and cursor metrics for debugging.

## Session queue and cursor persistence

The feed agent buffers events in a session queue while tracking a cursor so users resume where they left off.
Fetching follows [React/Next.js data-fetching patterns](https://nextjs.org/docs/app/building-your-application/data-fetching/fetching) and leverages [`useEffect` for client-side fetches](https://react.dev/reference/react/useEffect#fetching-data-with-effects).
When requesting more events, the cursor adds a `since` timestamp as described in [Nostr NIP-01 filters](https://github.com/nostr-protocol/nips/blob/master/01.md#filters).
The queue drops items older than a week to keep the feed fresh and bound in size.

## Single-screen upload flow

The upload page at `pages/create.tsx` (and locale variants in `[locale]/create.tsx`) renders the `CreateVideoForm` component from `components/create/CreateVideoForm.tsx`. This form keeps file selection, metadata entry and publishing on a single screen.

### Configuration

Set `NEXT_PUBLIC_UPLOAD_URL` to change the upload API endpoint. It defaults to `https://nostr.media/api/upload`.

### Requirements

- Accepted formats: mp4 and webm
- Maximum length: 5 minutes
- Trimming performed via WebCodecs

### Automatic trimming

Selecting a file triggers `utils/trimVideoWebCodecs.ts`, which trims the clip in the browser using WebCodecs. Progress is reported via a callback and updates local state.

### Progress bar

A thin progress bar appears at the bottom of the video preview while trimming is in progress (`progress > 0 && progress < 100`). It disappears once processing completes.

### Publish button validation

The **Publish** button remains disabled until a trimmed video is available and required metadata are supplied—at least one topic and a Lightning address. Validation logic lives in `CreateVideoForm.tsx` and is exposed through the `formValid` flag.

## Cross-origin headers

By default, the application sends `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` on all routes. These headers enable cross-origin isolation for features like WebCodecs.

Set `ENABLE_ISOLATION=false` to disable these headers and allow loading third-party resources that do not provide COEP/CORP.

## Service worker

The app expects `public/workbox-sw.js` to be present so requests to `/workbox-sw.js` succeed. This file is copied from `node_modules/workbox-sw/build/workbox-sw.js` during `postinstall`. Run `pnpm run copy-workbox` if you need to regenerate it manually.
