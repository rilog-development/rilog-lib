# rilog-chrome-extension

Manifest V3 Chrome DevTools extension — an advanced, standalone alternative to the Network tab: it captures requests (fetch/XHR), clicks, input changes, and console output on **any** site (not just ones using `rilog-lib`), with custom capture rules and an optional integration with `rilog-lib`-powered pages.

## Commands

```bash
npm install                                          # from the monorepo root
npm run build --workspace=rilog-chrome-extension      # tsc --noEmit + vite build → dist/
npm run dev --workspace=rilog-chrome-extension        # vite dev server (HMR)
```

Both commands can also be run directly from `packages/rilog-chrome-extension`.

## Loading it in Chrome

1. `npm run build` (produces `dist/`).
2. Open `chrome://extensions`, enable **Developer mode**, click **Load unpacked**, select `packages/rilog-chrome-extension/dist`.
3. Open any page → DevTools (F12) → the **Rilog** panel tab.

> If you load it via a scripted/CLI Chrome launch (`--load-extension=...`) instead of the "Load unpacked" button, some Chrome versions apply content-verification checks to unpacked extensions that block `popup`/`options` pages from loading (`ERR_FILE_NOT_FOUND`, "Content verify job failed" in Chrome's log) even though the extension itself loads fine. This is a quirk of that launch path, not the extension — loading via the normal **Load unpacked** button in `chrome://extensions` is unaffected.

## Architecture

```
manifest.json                  # MV3 manifest (content scripts, background, action, options, devtools)
src/
├── content/
│   ├── capture.ts              # MAIN world — patches fetch/XHR/console/click/focusout on the page directly
│   └── bridge.ts                # isolated world — relays capture.ts + rilog-lib's optional onPushEvent bridge to background
├── background/
│   ├── index.ts                  # message routing, devtools port relay, tab lifecycle
│   ├── store.ts                   # per-tab in-memory event log + capture/bridge dedupe
│   ├── rules.ts                    # rule matching engine + chrome.storage.local persistence
│   └── share/
│       ├── LocalShareAdapter.ts     # v1: chrome.storage.local + own share.html viewer
│       └── RemoteShareAdapter.ts    # stub for a future Rilog cloud public-events endpoint
├── devtools/
│   ├── devtools.ts                # chrome.devtools.panels.create('Rilog', ...)
│   └── panel/                     # the panel itself: event table, filters, detail slide-over
├── options/                      # rule editor (create/edit/delete IRilogRule)
├── popup/                        # capture pause toggle, per-tab event count, link to options
├── share/                        # standalone viewer for LocalShareAdapter-published events
├── ui/                             # shared React bits: theme hook, type badges, code blocks, formatting
├── styles/theme.css               # brand tokens (#002329 primary) + light/dark CSS variables
└── types/                         # rules, runtime message protocol, share adapter interface
```

### Why capture is standalone (not reused from `rilog-lib`)

`capture.ts` reimplements fetch/XHR/console/click/input capture rather than importing `rilog-lib`'s interceptors, because it runs in a different environment (a `MAIN`-world content script injected into arbitrary pages) with different constraints — it has to work on sites that never installed `rilog-lib`. What it *does* share with `rilog-lib` is the **type contract** from `@rilog-development/rilog-shared` (`ERilogEvent`, `IRilogEventItem`, `IRilogRequest*`, etc.) and a few capture-agnostic utilities (`generateUniqueId`, `getLocation`, `parseStackTrace`). See `packages/rilog-shared/README.md`.

### Optional bridge to `rilog-lib`

If a page already runs `rilog-lib`, wire its `onPushEvent` callback to the bridge to get richer, already-masked events in addition to (or instead of) the extension's own capture:

```ts
rilog.init({
    onPushEvent: (event) => window.postMessage({ source: 'rilog-devtools-bridge', event }, '*'),
});
```

`background/store.ts` dedupes: if both the extension's own capture and the bridge report the same request (matched by method+URL within a few seconds), the bridge version wins (it already went through `rilog-lib`'s own sensitive-data masking).

### Rules

Rules (`src/types/rules.ts`) match on event type, URL pattern, method, status range, a body dot-path/value, or a click selector, and can `notify` (native Chrome notification), `pin`, route into a named `openFilterTab`, or `console` log. Edit them from the extension's Options page (right-click the icon → Options, or the popup's "Manage rules" button).

### Share

`LocalShareAdapter` is v1: it serializes an event into `chrome.storage.local` and opens the bundled `share.html` viewer — works today, no backend required, but links only resolve in the same browser profile that created them. `RemoteShareAdapter` is an unimplemented stub for when the Rilog cloud web app exposes a public-events API; swap it in once that exists.

## Known gaps / next steps

- `RemoteShareAdapter` — not implemented (see above).
- The popup's "pause capture" toggle stops the isolated-world bridge from relaying events to the background — `capture.ts` keeps patching the page regardless (there's no way for a `MAIN`-world script to read `chrome.storage` to gate itself before patching).
- No automated tests yet for this package (rilog-lib/rilog-shared have Jest suites; this package currently only has `tsc --noEmit` as a correctness gate).
