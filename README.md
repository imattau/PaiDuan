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

Client-side video trimming relies on the [WebCodecs API](https://developer.mozilla.org/docs/Web/API/WebCodecs_API) with a lightweight polyfill for browsers lacking native support. Toast notifications are provided by [`react-hot-toast`](https://react-hot-toast.com/).

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

After updating client bundles, bump `CACHE_VERSION` in `apps/web/public/sw.js` so
new deployments invalidate old precaches and prevent `ChunkLoadError`.

Open the app and choose **Install** (or **Add to Home Screen**) to install it.

## CDN configuration

Static assets in `apps/web/public` are served with long-lived caching headers. When deploying:

- **Vercel** respects `Cache-Control` by default, so no extra setup is required.
- **Cloudflare** should be set to *Respect Existing Headers* or *Origin Cache Control* so the `Cache-Control: public, max-age=31536000, immutable` header is honored.

Verify locally by running `pnpm --filter @paiduan/web dev` and inspecting network responses in your browser's developer tools to confirm the `Cache-Control` value.

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

The feed includes a floating upload button that opens a three‑step wizard. Recording video directly in
the browser is not supported—prepare clips ahead of time:

### Requirements

- Accepted formats: mp4 and webm
- Maximum length: 5 minutes
- Trimming performed via WebCodecs

1. Select a clip (MP4/WebM, ≤5 min)
2. Trim the clip in the browser and capture a poster frame
3. Add a caption, upload the assets, and publish a NIP‑71 event (kind 21 for normal videos, kind 22 for short clips)

Publishing now includes `['zap', <lnaddr>, <pct>]` tags for the creator and any collaborators when Lightning addresses are provided. Video events are encoded using NIP‑71, which relies on `imeta` tags from NIP‑92 to describe the video and poster URLs.

For manual testing of the upload endpoint you can use cURL:

```bash
curl -F "file=@video.mp4" -F "poster=@poster.jpg" https://nostr.media/api/upload
```

The response returns `video`, `poster` and `manifest` URLs that can be referenced from an `imeta` tag when constructing a kind 21/22 event.

Set the `NEXT_PUBLIC_UPLOAD_URL` environment variable to point the app at a different upload server.

### NIP‑71 video events

PaiDuan uses [NIP‑71](https://github.com/nostr-protocol/nips/blob/master/71.md) for publishing video posts. Clients should:

1. Upload media to obtain a primary video URL, an optional adaptive `manifest` URL and a poster image.
2. Decide whether the clip is a **normal** (landscape) or **short** (portrait) video. Publish kind 21 for normal videos or kind 22 for shorts.
3. Include at least one `imeta` tag per media variant. Each tag lists `dim`, `url`, `m` (MIME type) and one or more `image` fields for previews.
4. Add optional metadata such as `title`, `published_at`, hashtag `t` tags and `zap` split tags.

Consumers subscribe to kinds 21 and 22, parse the `imeta` tags to find playable URLs and preview images, and display the `title` or event `content` as the caption. Topic `t` tags can be aggregated to build hashtag feeds.

## Revenue share

Zaps sent to a video are split between the creator and the platform treasury. By default the creator receives 95 % and the treasury
receives 5 %. Creators can add up to four collaborator Lightning addresses on their profile page; the percentage for each
collaborator is deducted from the creator's 95 % share. The total of all collaborator percentages plus the 5 % treasury fee must
not exceed 100 %.

Revenue splits are stored in the creator's kind 0 metadata as a `zapSplits` array and can be edited from the **Revenue Share**
card when viewing your own profile at `/p/<pubkey>`. When a zap is sent, the app performs separate LNURL‑pay requests for each
recipient and records the distribution in a public kind 9736 event. The treasury address is configured via the `NEXT_PUBLIC_TREASURY_LNADDR`
environment variable.

## Wallet management

Verify that you control a Lightning address from **Settings → Lightning Wallets**.
Click **Verify ownership** next to an entry to complete an LNURL-auth challenge against the address's domain. Successful verifications are stored with the wallet data when saving your profile.

Use **Export wallet config** to download an encrypted JSON backup of your `wallets` and any `zapSplits`. Restore the data later with **Import wallet config**. Backups are encrypted with your current authentication keys so only you can decrypt them.

## Transcoding & adaptive bitrate

Uploaded videos are transcoded to multiple resolutions and served adaptively.
A worker in `packages/transcoder` downloads the source, generates
240p, 480p and 720p variants and uploads them to `/variants/<id>/`. A JSON
manifest is written alongside the files and returned with the custom MIME type
`application/paiduan+json`:

```json
{ "240": "https://.../240.webm", "480": "https://.../480.webm", "720": "https://.../720.webm" }
```

Run the worker locally (requires Docker) with:

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
items persist in `localStorage` so the badge survives a reload. During
onboarding the app requests permission for browser notifications and
subscribes the device to push messages via a service worker.

## Settings & theming

The `/settings` page provides controls for the app's appearance. Switch between
light and dark themes, pick an accent colour, or clear cached videos,
notifications and follow data. Preferences are saved in `localStorage` and
applied across all pages. A sun/moon icon in the toolbar also toggles light and
dark modes without leaving the feed.

Theming is driven by CSS variables declared in `apps/web/styles/globals.css`.
`next-themes` manages the `data-theme` attribute and the Theme Agent's
`useThemeAgent()` hook keeps DOM attributes in sync. Chakra UI and Tailwind map
their colour tokens to these variables, making CSS variables plus
`next-themes` the single source of truth.

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
