# PaiDuan Monorepo

This repository uses [Turborepo](https://turbo.build) with pnpm workspaces.

## Development

```bash
pnpm install
pnpm dev
```

The development server starts the Next.js web app at <http://localhost:3000>.
The moderation dashboard runs on <http://localhost:3001>.
Visit <http://localhost:3000/feed> for the swipeable video feed demo.

Client-side video trimming now relies on the [WebCodecs API](https://developer.mozilla.org/docs/Web/API/WebCodecs_API) with a lightweight polyfill for browsers lacking native support, eliminating the previous `ffmpeg.wasm` dependency. Toast notifications are provided by [`react-hot-toast`](https://react-hot-toast.com/).

## Relay configuration

Override the default Nostr relays with the `NEXT_PUBLIC_RELAYS` environment variable or by editing `apps/web/relays.json`. The environment variable accepts a comma‑separated list or a JSON array. If neither is provided, the app falls back to `wss://relay.damus.io`, `wss://nos.lol` and `wss://relay.snort.social`.

## PWA features

The web client ships as a Progressive Web App:

- Installable on desktop and mobile via the browser menu or the in‑app install banner.
- Works offline by caching pages, avatars and the last 20 videos watched.
- Zap / comment buttons disable while offline.
- Clear cached videos via **Settings → Storage**.

To generate the service worker for production run:

```bash
pnpm --filter @paiduan/web build
pnpm --filter @paiduan/web build:pwa
```

Open the app and choose **Install** (or **Add to Home Screen**) to install it.

## Tests

```bash
pnpm test
```

## Creator Analytics

Creators can access a private dashboard at `/analytics` (alias `/p/<pubkey>/analytics`) showing views, zaps, comments, follower changes and revenue. A cron job (`scripts/aggregate-creator-stats.ts`) aggregates daily metrics and stores them in a lightweight DB. The API (`GET /api/creator-stats?pubkey=<hex>`) returns total counts and a 30-day `dailySeries`. Use the **Download CSV** button to export `date,views,zapsSats,comments,followerDelta,revenueAud` columns.

## Moderation & reports

Users can flag inappropriate videos or comments via the **⋮** menu on each item. Reports include a reason and optional notes and are published as Nostr kind 30041 events. When an item receives three unique reports, or if reported by an admin, it is hidden from public feeds pending review.

Moderators with a matching `ADMIN_PUBKEY` cookie can visit `/admin/modqueue` to review open reports. From there they may **Approve** a video or **Remove** it, which publishes a hide event (kind 9001) so the content stays filtered.

A weekly transparency summary can be generated with:

```bash
pnpm run cron:summary
```

The script outputs a kind 9002 event noting total reports and actions for the week.

The lightning zap flow can be tested with a wallet such as [Alby](https://getalby.com) running in testnet mode or an [LNbits](https://lnbits.com) instance.

## Uploading a video

The feed includes a floating upload button that opens a three‑step wizard:

1. Select or record a short clip (MP4/WebM, ≤3 min)
2. Trim the clip and capture a poster frame
3. Add a caption, upload the assets, and publish a NIP‑23 note

Publishing now includes an optional `['zap', <lnaddr>]` tag when a Lightning address is available.

For manual testing of the upload endpoint you can use cURL:

```bash
curl -F "file=@video.mp4" -F "poster=@poster.jpg" https://nostr.media/api/upload
```

The response returns `video` and `poster` URLs that can be used in a kind 30023 event.

## Revenue share

Zaps sent to a video are split between the creator and the platform treasury. By default the creator receives 95 % and the treasury
receives 5 %. Creators can add up to four collaborator Lightning addresses on their profile page; the percentage for each
collaborator is deducted from the creator's 95 % share. The total of all collaborator percentages plus the 5 % treasury fee must
not exceed 100 %.

Revenue splits are stored in the creator's kind 0 metadata as a `zapSplits` array and can be edited from the **Revenue Share**
card when viewing your own profile at `/p/<pubkey>`. When a zap is sent, the app performs separate LNURL‑pay requests for each
recipient and records the distribution in a public kind 9736 event. The treasury address is configured via the `NEXT_PUBLIC_TREASURY_LNADDR`
environment variable.

## Transcoding & adaptive bitrate

Uploaded videos are transcoded to multiple WebM resolutions and served adaptively.
A worker in `packages/transcoder` downloads the source, runs FFmpeg to produce
240p, 480p and 720p variants and uploads them to `/variants/<id>/`. A JSON
manifest is written alongside the files and returned with the custom MIME type
`application/paiduan+json`:

This server-side process replaces the earlier client-side FFmpeg setup, so the web app no longer ships `ffmpeg.wasm` assets.

```json
{ "240": "https://.../240.webm", "480": "https://.../480.webm", "720": "https://.../720.webm" }
```

Run the worker locally (requires Docker/FFmpeg) with:

```bash
pnpm --filter transcoder start <srcUrl>
```

The script outputs the three variants and `manifest.json` inside
`variants/<generated-id>/`.

## Comments & replies

Videos support threaded discussions. Comments and replies are plain Nostr kind 1
events tagged with the video's event id using an `e` tag. Replies include an
additional `e` tag for the parent event id and a `p` tag for the parent
pubkey. The web client opens a drawer from the bottom half of the screen where
users can read the thread, post comments or replies, and see updates in real
time.

## Notifications

The web client listens for zap receipts (kind 9735) and new comments on your
videos in real time. A bell icon in the app bar shows the count of unseen
alerts and opens a slide‑down drawer listing the newest notifications. Unread
items persist in `localStorage` so the badge survives a reload.

## Settings & theming

The `/settings` page provides controls for the app's appearance. Switch between
light and dark themes, pick an accent colour, or clear cached videos,
notifications and follow data. Preferences are saved in `localStorage` and
applied across all pages. A sun/moon icon in the toolbar also toggles light and
dark modes without leaving the feed.

## Internationalisation

The web app uses [`next-intl`](https://next-intl-docs.vercel.app/) with explicit
locale prefixes (`/en`, `/zh`, `/ar`). English is the default locale. Add new
languages by creating `apps/web/locales/<code>/common.json` and updating
`apps/web/middleware.ts`.

Right-to-left scripts such as Arabic are supported. The `<body>` element
receives `dir="rtl"` and Tailwind's RTL plugin mirrors paddings and margins
automatically.

## Feed modes

The feed supports three modes:

- **For You** – shows all recent videos.
- **Following** – filters to events authored by pubkeys in the local following list.
- **Tags** – displays popular `t` tags from recent videos and lets you explore by hashtag.

The following list is populated from the browser's `localStorage`. A helper
`follow(pubkey)` is available in `useFollowing` to add new authors.

## Profiles

Each creator has a profile page at `/p/<pubkey>` that displays their avatar,
name, bio, follower count and recent videos. Viewers can follow or unfollow a
creator from this page or by using the Follow button shown under videos in the
feed. The following list and follower counts are persisted in the browser's
`localStorage`.

## Search & sharing

The top navigation includes a search bar that lets you look up videos and creators.

- `@creator` – search by display name or other metadata.
- `#tag` – filter videos by hashtag.
- plain text – matches caption text, tags and creator bios.

Search results link directly to profile pages (`/p/<pubkey>`) and stand-alone
video pages (`/v/<id>`). Every video card also has a Share button that copies
the full URL (e.g. `<origin>/v/<id>`) to the clipboard. Tags can be shared via
`/feed?tag=<tag>`.

## Analytics & crash reporting

PaiDuan can report anonymous usage metrics and runtime errors.

- Analytics are powered by a self-hosted [Plausible](https://plausible.io) instance at `stats.paiduan.app`.
  The script is only loaded when `NEXT_PUBLIC_ANALYTICS=enabled` and users have opted in.
  Events are proxied through `/api/event` to avoid third-party cookies. Custom events include `zap_click`,
  `comment_send`, `install_prompt_shown` and `install_prompt_accepted`, along with page views for feed,
  video and profile pages.
- Crash reports use [`@sentry/nextjs`](https://docs.sentry.io/platforms/javascript/guides/nextjs/). Provide your own DSN via `NEXT_PUBLIC_SENTRY_DSN`.
- Users can opt out of both analytics and crash reporting via **Settings → Privacy → Send anonymous usage data**.
  The preference is stored in `localStorage` and a reload applies the change.
