# Web App

## Single-screen upload flow

The upload page at `pages/create.tsx` (and locale variants in `[locale]/create.tsx`) renders the `CreateVideoForm` component from `components/create/CreateVideoForm.tsx`. This form keeps file selection, metadata entry and publishing on a single screen.

### Requirements

- Accepted formats: mp4 and webm
- Maximum length: 5 minutes
- Required aspect ratio: 9:16
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
