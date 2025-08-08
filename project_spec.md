## 🛠️ Sprint ⓳ – Nostr Auth, Onboarding & Profile Management

### Objective

Replace “Enter Feed” with standard Nostr login flow, support new/imported keys, remote signer logins, onboarding after auth, and complete profile management.

### Tasks

| #   | Area                 | Work required                                                                                                                                                 |
| --- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Replace entry        | Remove “Enter Feed” button. Add Nostr login UI on landing page with 3 options: **Import key**, **Generate new key**, **Remote signer login** (NIP-46/NIP-07). |
| 2   | Key import           | Support `nsec` and raw hex; decode to 32-byte Uint8Array; validate length; save to localStorage/session.                                                      |
| 3   | Key generation       | Use `nostr-tools` `generateSecretKey()` (not deprecated `generatePrivateKey()`), derive pubkey; store keys.                                                   |
| 4   | Security             | Encrypt privkey at rest via WebCrypto + passphrase; prompt passphrase on app start.                                                                           |
| 5   | Remote signer        | Implement NIP-46 connect flow; persist pubkey, no privkey stored.                                                                                             |
| 6   | Post-auth onboarding | After successful import/generate/login, route to `/onboarding/profile`.                                                                                       |
| 7   | Profile onboarding   | If imported key has existing kind 0 profile, prefill name, picture, about; else show empty form.                                                              |
| 8   | Profile UI           | Avatar upload (browser file → Blob URL or upload to media API), name, bio; publish kind 0 metadata to relays.                                                 |
| 9   | Profile page         | `/p/[pubkey]` shows banner, avatar, name, bio, zaps, follow; edit button if own profile.                                                                      |
| 10  | Export keys          | Settings → “Keys” section to copy/export `nsec` or pubkey; warn about privkey handling.                                                                       |
| 11  | Testing              | Validate that login state persists, keys work for publishing/zaps, and onboarding flows correctly.                                                            |

### Acceptance Criteria

- Landing page shows modern styled login buttons (dark/light mode visible).
- Import accepts both `nsec` and hex, rejects invalid keys.
- Generate uses new API and stores securely.
- Remote signer works with NIP-46/NIP-07 providers.
- Onboarding after auth leads to profile setup or edit.
- Profile updates publish to relays and reflect in `/p/[pubkey]`.
- Keys can be exported from settings.
- All UI responsive for desktop, tablet, mobile.

---

## 🛠️ Sprint ⓴ – Creator Tools UX Overhaul & Video Processing Fixes

### Objective

Modernise Creator Wizard UI, fix tool loading/trim bugs, add recording option, and ensure WebM (9:16) is default format.

### Tasks

| #   | Area               | Work required                                                                                                                                                                      |
| --- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | CreatorWizard UI   | Replace current 3-step flow with wizard that first asks “What do you want to do?” — options: **Record video**, **Upload existing**, **Import from URL**.                           |
| 2   | Dynamic components | Load relevant step component depending on option (e.g., `RecordStep.tsx`, `UploadStep.tsx`).                                                                                       |
| 3   | Recording          | Implement `getUserMedia()` recording via `MediaRecorder` API; ≤3 minutes; store Blob in state.                                                                                     |
| 4   | Upload             | Existing file input flow; enforce ≤3 minutes; immediately transcode if not WebM.                                                                                                   |
| 5   | Transcoding        | Use the WebCodecs API with a polyfill; default to WebM VP9, 9:16 crop. |
| 6   | Trim tool          | Ensure trim UI loads only after video metadata loaded; fix “pressing Next throws trim error” by validating clip bounds.                                                            |
| 7   | Poster capture     | Frame capture via `<canvas>`; store as JPEG/WebP; attach to upload payload.                                                                                                        |
| 8   | Upload flow        | POST video + poster to `nostr.media/api/upload`; show progress; on success, publish NIP-23 event.                                                                                  |
| 9   | Error handling     | Toasts for FFmpeg load failure, file type issues, upload errors.                                                                                                                   |
| 10  | Responsive design  | Wizard, video preview, and controls adapt cleanly to mobile/desktop.                                                                                                               |

### Acceptance Criteria

- CreatorWizard first screen is option chooser.
- Recording, uploading, importing all work end-to-end.
- All videos output as WebM (VP9), 9:16 cropped if needed.
- Trim works without errors; poster capture succeeds.
- UI looks modern, consistent with landing/auth redesign.
- FFmpeg loads only when needed, no `createFFmpeg` import errors.
