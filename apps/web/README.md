# Web App

## Single-screen upload flow

The upload page at `pages/create.tsx` (and locale variants in `[locale]/create.tsx`) renders the `CreateVideoForm` component from `components/create/CreateVideoForm.tsx`. This form keeps file selection, metadata entry and publishing on a single screen.

### Automatic conversion

Selecting a file triggers `utils/trimVideoWebCodecs.ts`, which trims and re-encodes the clip in the browser. Conversion progress is reported via a callback and updates local state.

### Progress bar

A thin progress bar appears at the bottom of the video preview while conversion is running (`progress > 0 && progress < 100`). It disappears once encoding completes.

### Publish button validation

The **Publish** button remains disabled until a converted video is available and required metadata are supplied—at least one topic and a Lightning address. Validation logic lives in `CreateVideoForm.tsx` and is exposed through the `formValid` flag.
