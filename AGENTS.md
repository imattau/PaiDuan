# AGENTS.md

Defines the responsibilities, inputs, outputs, and boundaries of each autonomous module (agent) in PaiDuan.
This keeps Codex and devs aligned and prevents scope creep.

---

## Principles

- Single responsibility per agent
- Clear contracts: inputs, outputs, events
- UI reads state and dispatches actions only
- Work off the main thread where possible
- Feature flags for risky paths
- Telemetry for every agent

---

## Agent index

- **UI Agent**. Pages, components, layout, accessibility
- **Theme Agent**. Dark/light, density, tokens
- **Nostr Agent**. Relay pool, subs, filters, backoff, parsing
- **Library Agent**. Local media catalogue in IndexedDB
- **Media Agent**. Probe, poster, sprites, trims, transcode decisions
- **Upload Agent**. Chunked, resumable uploads, pause/resume, background queue
- **Playback Agent**. Player sources, tracks, quality, HLS hookup
- **Worker Agent**. Web Worker RPC, job orchestration
- **SW Agent**. Service worker routes, precache, background sync
- **Telemetry Agent**. Errors, performance, web vitals, feature flags

Directory suggestion:

```
/agents
  ui/
  theme/
  nostr/
  library/
  media/
  upload/
  playback/
  worker/
  sw/
  telemetry/
```

---

## Contracts

### UI Agent

**Scope**
Render pages and components. Manage layout and interactions. No data fetching inside components.

**Inputs**
Zustand selectors, React Query selectors, event callbacks from other agents.

**Outputs**
User events to agents. Accessible DOM.

**API**
None. Consumes only.

**Done when**
No direct network calls or media work in components. All lists virtualised.

---

### Theme Agent

**Scope**
CSS variables, dark/light, compact density, tokens.

**Inputs**
User preference, OS theme, `next-themes`.

**Outputs**
Document attributes, CSS vars.

**API**

```ts
getTheme(): 'light'|'dark'
setTheme(t: 'light'|'dark'): void
setDensity(d: 'compact'|'cozy'): void
tokens(): Record<string,string|number>
```

**Done when**
Toggling theme or density updates all components without overrides.

---

### Nostr Agent

**Scope**
One WebSocket per relay, sub dedupe, filter normalisation, EOSE handling, backoff, NOTICE throttling.

**Inputs**
Subscription requests from UI or Library Agent.

**Outputs**
Parsed events to stores. Relay health metrics.

**API**

```ts
type Filter = { kinds?: number[]; authors?: string[]; since?: number; limit?: number; '#t'?: string[] }
subscribe(key: string, filters: Filter[], onEvent: (e: NostrEvent)=>void): { close: ()=>void }
publish(event: NostrEvent): Promise<Ack>
getRelayHealth(): RelayHealth[]
```

**Rules**
Always apply `since` and `limit`. Close historical subs on EOSE. Exponential backoff with jitter.

**Done when**
One socket per relay. Stable sub count. No “too many requests” notices in normal use.

---

### Library Agent

**Scope**
IndexedDB catalogue of media. Search, filter, sort. Drafts and versions.

**Inputs**
Media metadata from Media Agent and Upload Agent. User edits.

**Outputs**
Lists and detail records for UI. Cache hits for Playback Agent.

**API**

```ts
list(query: Partial<{ status:'draft'|'published'; q:string; tags:string[] }>): Promise<MediaItem[]>
get(id: string): Promise<MediaItem>
put(item: MediaItem): Promise<void>
remove(id: string): Promise<void>
```

**Done when**
Cold open shows recent items instantly from cache. Search is sub 50 ms on 1k items.

---

### Media Agent

**Scope**
Preflight probe, capability check, poster and sprite generation, keyframe trims, transcode decisions. Heavy work off thread.

**Inputs**
File handles from UI. Browser capability via MediaCapabilities and WebCodecs.

**Outputs**
Metadata, posters, preview clips, trim artefacts. Plan for upload.

**API**

```ts
probe(file: File): Promise<MediaInfo>           // uses mediainfo.js + fallbacks
decide(info: MediaInfo): 'direct'|'remux'|'transcode'
poster(file: File, atSec?: number): Promise<Blob>
sprite(file: File, frames: number): Promise<Sprite>
trim(file: File, inSec: number, outSec: number): Promise<Blob> // mp4box fast path, ffmpeg precise
```

**Rules**
Prefer WebCodecs and mp4box for fast paths. Use FFmpeg only when needed. Never block UI.

**Done when**
Poster in under 1 s for 1080p. Trim preview without full transcode where possible.

---

### Upload Agent

**Scope**
Chunked, resumable uploads, pause/resume, cancel, retry. Background-aware UI state.

**Inputs**
Files or blobs from Media Agent. Network status.

**Outputs**
Progress events, final URLs for Library Agent and Publish.

**API**

```ts
start(job: { file: Blob; name: string; kind: 'original'|'preview'|'poster' }): UploadHandle
resume(id: string): UploadHandle
pause(id: string): void
cancel(id: string): void
onProgress(id: string, fn: (p: Progress)=>void): Unsub
```

**Done when**
Close tab and return. Upload resumes. UI shows real progress, ETA, and errors.

---

### Playback Agent

**Scope**
Player config, source selection, HLS hookup, caption tracks, mini player on scroll.

**Inputs**
Media item from Library Agent. Network hints.

**Outputs**
Player state to UI. Time and view events to Telemetry.

**API**

```ts
attach(el: HTMLVideoElement, src: SourceSet): PlayerHandle
setQuality(q: 'auto'|'low'|'high'): void
togglePiP(): void
```

**Done when**
Playback starts promptly with poster. HLS sources switch via hls.js. Keyboard shortcuts work.

---

### Worker Agent

**Scope**
Comlink RPC to workers. Queue and isolate heavy jobs. Cancel and progress.

**Inputs**
Job descriptions from Media and Upload Agents.

**Outputs**
Results or errors back to callers.

**API**

```ts
run<T>(job: WorkerJob<T>): Promise<T>
cancel(jobId: string): void
onProgress(jobId: string, cb: (n: number)=>void): Unsub
```

**Done when**
Main thread remains responsive during probe, poster, trim, or transcode.

---

### SW Agent

**Scope**
Service worker routes, precache shell, runtime caching, background sync for uploads.

**Inputs**
Workbox config. Upload requests from Upload Agent.

**Outputs**
Offline responses, sync retries, SW status to UI.

**API**

```ts
register(): Promise<void>
getStatus(): Promise<'installed'|'updated'|'redundant'>
enqueueForSync(request: Request): Promise<void>
```

**Done when**
App shell is instant offline. Uploads resume after reconnect. SW status visible in dev panel.

---

### Telemetry Agent

**Scope**
Errors, performance tracing, web vitals, feature flags exposure.

**Inputs**
Events from all agents.

**Outputs**
Sentry traces, console in dev, on-screen diagnostics when enabled.

**API**

```ts
track(event: string, data?: any): void
trace<T>(name: string, fn: ()=>Promise<T>): Promise<T>
flag(name: string): boolean
```

**Done when**
You can see slow steps, relay notices per minute, and FFmpeg job times in prod.

---

## Event bus (lightweight)

Use a typed event hub so agents do not import each other.

```ts
type AppEvent =
  | { type: 'media.probed'; item: MediaInfo }
  | { type: 'upload.progress'; id: string; pct: number }
  | { type: 'nostr.notice'; relay: string; msg: string };

export const bus = {
  emit(e: AppEvent): void {},
  on<T extends AppEvent['type']>(t: T, cb: (e: Extract<AppEvent,{type:T}>)=>void): Unsub,
};
```

---

## Feature flags

- `enableWebCodecs`
- `enableCompactDensity`
- `enableNdk`
- `enableHlsPlayback`

Expose in a small settings screen for dev and qa.

---

## Guardrails

- UI Agent never imports Nostr, Media, Upload internals
- Nostr Agent never touches the DOM
- All heavy work runs in Worker Agent
- Every agent logs to Telemetry Agent with a namespace
- Tests cover contracts and basic flows

---

## Acceptance checklist

- New upload: Media Agent probes, decides path, poster ready under 1 s
- Upload: Upload Agent shows progress, pause, resume
- Publish: Library Agent updated and visible instantly
- Feed: Nostr Agent maintains 1 socket per relay, subs close on EOSE
- Playback: HLS and MP4 work, mini player on scroll
- Offline: SW Agent serves shell and cached items, background sync resumes
