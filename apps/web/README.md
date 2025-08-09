# Web App

## Single-screen upload flow

The upload page at `pages/create.tsx` (and locale variants in `[locale]/create.tsx`) renders the `CreateVideoForm` component from `components/create/CreateVideoForm.tsx`. This form keeps file selection, metadata entry and publishing on a single screen.

### Automatic conversion

Selecting a file triggers `utils/trimVideoWebCodecs.ts`, which trims and re-encodes the clip in the browser. Conversion progress is reported via a callback and updates local state.

### Progress bar

A thin progress bar appears at the bottom of the video preview while conversion is running (`progress > 0 && progress < 100`). It disappears once encoding completes.

### Publish button validation

The **Publish** button remains disabled until a converted video is available and required metadata are supplied—at least one topic and a Lightning address. Validation logic lives in `CreateVideoForm.tsx` and is exposed through the `formValid` flag.

## Cross-origin headers

By default, the application sends `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` on all routes. These headers enable cross-origin isolation, which is required for future multi-threaded FFmpeg builds in the browser.

Set `ENABLE_ISOLATION=false` to disable these headers and allow loading third-party resources that do not provide COEP/CORP.
