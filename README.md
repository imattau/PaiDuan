# PaiDuan Monorepo

This repository uses [Turborepo](https://turbo.build) with pnpm workspaces.

## Development

```bash
pnpm install
pnpm dev
```

The development server starts the Next.js web app at <http://localhost:3000>.
Visit <http://localhost:3000/feed> for the swipeable video feed demo.

Client-side video trimming relies on [`@ffmpeg/ffmpeg`](https://github.com/ffmpegwasm/ffmpeg.wasm) and toast notifications are provided by [`react-hot-toast`](https://react-hot-toast.com/).

## Tests

```bash
pnpm test
```

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

## Comments & replies

Videos support threaded discussions. Comments and replies are plain Nostr kind 1
events tagged with the video's event id using an `e` tag. Replies include an
additional `e` tag for the parent event id and a `p` tag for the parent
pubkey. The web client opens a drawer from the bottom half of the screen where
users can read the thread, post comments or replies, and see updates in real
time.

## Feed modes

The feed supports three modes:

* **For You** – shows all recent videos.
* **Following** – filters to events authored by pubkeys in the local following list.
* **Tags** – displays popular `t` tags from recent videos and lets you explore by hashtag.

The following list is populated from the browser's `localStorage`. A helper
`follow(pubkey)` is available in `useFollowing` to add new authors.
