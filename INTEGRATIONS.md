# Integration Guide — rilog-lib changes

This document describes changes made to `rilog-lib` that require corresponding updates on the **backend** and **frontend (admin panel)**. Use it as a prompt when working with those codebases.

---

## Summary of lib changes

| Area | Change | Impact |
|---|---|---|
| Encryption | AES (crypto-js) removed — payload is now plain JSON | **Backend: breaking** |
| Storage | localStorage → IndexedDB | No impact |
| New event: INPUT | Input field capture on focus-out | Backend + Frontend |
| Console events | New fields: `source`, `errorFile`, `errorLine`, `errorColumn` | Backend + Frontend |
| XHR interception | New automatic source for REQUEST events | Frontend (labeling) |
| Last Gasp | `sendBeacon` / `fetch keepalive` on page close | Backend (Content-Type) |
| React ErrorBoundary | DEBUG_MESSAGE with label `FATAL_REACT_ERROR` | Frontend (display) |
| `salt` field | Removed from init response, no longer sent by lib | Backend (cleanup) |
| **Device info** | `deviceInfo` added to `/connection/init` body and to local/selfServer events payload | **Backend + rilog-local-server** |

---

## Backend changes

---

### 1. Remove AES decryption — BREAKING

**Priority: critical. Must be done before deploying a new lib version.**

Previously the lib encrypted the events payload with AES before sending:

```
POST /connection/send
Body: { eventsData: "<AES encrypted string>" }
```

Now `eventsData` is a plain JSON string:

```
POST /connection/send
Body: { eventsData: "[{\"_id\":\"...\", \"type\": 0, ...}]" }
```

**What to change:**
- Remove `CryptoJS.AES.decrypt(eventsData, salt)` (or equivalent) from the events save handler
- Parse `eventsData` directly with `JSON.parse(eventsData)`
- The rest of the pipeline (validation, storage) stays the same

```ts
// Before:
const decrypted = CryptoJS.AES.decrypt(req.body.eventsData, salt).toString(CryptoJS.enc.Utf8);
const events = JSON.parse(decrypted);

// After:
const events = JSON.parse(req.body.eventsData);
```

---

### 2. Remove `salt` from `/connection/init` response (optional cleanup)

The lib no longer reads the `salt` field from the init response. The backend can stop generating and returning it. This is **non-breaking** — sending an unused field causes no errors.

```ts
// Can remove:
const salt = generateSalt();
return { access_token, salt, recording };

// Simplified:
return { access_token, recording };
```

---

### 3. Add `INPUT` event type to schema

A new event type `INPUT` (enum value `2`) is now emitted when a user leaves an input field. Add it to the events schema and storage.

**`ERilogEvent` enum — must match the lib:**

```ts
enum ERilogEvent {
    REQUEST = 0,
    CLICK = 1,
    INPUT = 2,
    CONSOLE_ERROR = 3,
    DEBUG_MESSAGE = 4,
    CONSOLE_WARN = 5,
}
```

**`IRilogInput` payload shape:**

```ts
interface IRilogInput {
    type: 0; // RilogInputEvent.BLUR
    value: string; // "*" for password/cc fields
    nodeName: string; // "INPUT", "TEXTAREA", "SELECT"
    className: string;
    id: string;
    name: string; // input name attribute
    inputType: string; // "text", "email", "number", etc.
}
```

**Storage schema addition:**
- Add `INPUT` to event type enum/discriminator
- Index on `name` and `inputType` fields for filtering

---

### 4. Update `IRilogConsoleData` schema

Console events now include new fields. Update the storage schema and API response types.

```ts
interface IRilogConsoleData {
    level: 'warn' | 'error';
    message: string;
    stackTrace?: string;

    // NEW — source of the error
    source: 'console' | 'runtime' | 'unhandledRejection';

    // NEW — populated for runtime exceptions (window.onerror)
    errorFile?: string;   // URL of the JS file where the error occurred
    errorLine?: number;   // line number
    errorColumn?: number; // column number
}
```

**What to change:**
- Add `source`, `errorFile`, `errorLine`, `errorColumn` columns/fields to console events storage
- These fields are optional — old events without them are still valid

---

### 5. Verify sendBeacon compatibility

When a page closes, the lib sends pending events using `navigator.sendBeacon` with a `Blob` payload:

```ts
navigator.sendBeacon(url, new Blob([JSON.stringify({ events: eventsData })], { type: 'application/json' }));
```

`sendBeacon` with `Blob(type: 'application/json')` sends `Content-Type: application/json`. Most backends handle this correctly. Verify that:
- The events endpoint accepts `Content-Type: application/json` from `sendBeacon` (no CORS preflight — sendBeacon uses simple request rules)
- The endpoint handles requests without `Authorization` header if using `sendBeacon` for selfServer mode (sendBeacon cannot set custom headers)

For **Rilog cloud**, the lib uses `fetch` with `keepalive: true` which does send the `Authorization: Bearer <token>` header — no changes needed there.

---

## Frontend (admin panel) changes

---

### 1. Display INPUT events

Add UI support for the new `INPUT` event type (enum `2`).

**Event card should show:**
- Field identifier: `name` or `id` attribute (prefer `name`)
- Input type: `inputType` (text, email, select, etc.)
- Value: display as-is; if value is `"*"` show a "masked" badge
- Node type: `nodeName`
- Page URL from `event.location.href`

**Filtering / grouping:**
- Add `INPUT` to event type filter dropdown
- Consider grouping inputs by page URL or by form (group inputs with the same `name` prefix)

---

### 2. Enhance console event display

Console events now carry a `source` field. Use it to differentiate:

| `source` value | Suggested label | Color/icon |
|---|---|---|
| `"console"` | console.error / console.warn | Yellow / orange |
| `"runtime"` | Uncaught exception | Red |
| `"unhandledRejection"` | Unhandled Promise | Red + async badge |

For `source: "runtime"` events, display the additional fields if present:
- **File:** `errorFile` (link to source if source maps available)
- **Line:** `errorLine` : `errorColumn`

Example UI for a runtime error card:
```
[UNCAUGHT EXCEPTION]  runtime
ReferenceError: foo is not defined
File: https://app.example.com/static/js/main.chunk.js
Line: 142 : 18
Stack trace: ...
```

---

### 3. Mark XHR vs fetch REQUEST events (optional enhancement)

Currently all HTTP requests are stored as `REQUEST` events. The lib now captures both `fetch` and `XMLHttpRequest` requests. There is no separate type for XHR — they arrive as the same `REQUEST` event.

If you want to distinguish them in the UI: the lib does not currently include a `transport` field in the request payload. Options:
- Add a `transport: "fetch" | "xhr"` field to `IRilogRequest` in the lib (future)
- Or infer from headers — XHR requests often have `X-Requested-With: XMLHttpRequest`

This is a low-priority enhancement — not required for the current version.

---

### 4. Display FATAL_REACT_ERROR debug messages

React ErrorBoundary component sends `DEBUG_MESSAGE` events with `label: "FATAL_REACT_ERROR"`. The event `data` shape:

```ts
{
    data: string; // JSON.stringified: { message, stack, componentStack }
    label: "FATAL_REACT_ERROR";
    shouldBeParsed: true;
    stackTrace?: string;
}
```

**Suggested UI treatment:**
- Add a special visual style for events with `label === "FATAL_REACT_ERROR"` (red banner, "FATAL" badge)
- Parse and display `componentStack` separately from the JS stack — it shows the React component tree that led to the crash
- This is the most critical event type — consider pushing a notification or highlighting it at the top of the session

---

### 5. Update event type filter to include all types

Make sure the event type filter/legend includes all current types:

| Value | Name | New? |
|---|---|---|
| 0 | REQUEST | — |
| 1 | CLICK | — |
| 2 | INPUT | **New** |
| 3 | CONSOLE_ERROR | — |
| 4 | DEBUG_MESSAGE | — |
| 5 | CONSOLE_WARN | — |

---

---

### 6. Device info — new field on `/connection/init` and events payload

The lib now collects device information once on `init()` and attaches it to every outbound payload.

**For Rilog cloud — `/connection/init` body now includes `deviceInfo`:**

```ts
// POST /connection/init
{
    uToken: string;
    appId: string;
    externalInfo?: { userAgent: string; meta?: TExternalInfoMeta };
    deviceInfo?: TDeviceInfo;   // NEW
}
```

**For localServer / selfServer — `deviceInfo` is included in the events save payload:**

```ts
// POST /api/events/save  (local/self server)
{
    events: string;           // JSON.stringify(IRilogEventItem[])
    uToken: string;
    appName?: string;         // localServer only
    params?: Record<string, string>;  // localServer only
    deviceInfo?: TDeviceInfo; // NEW
}
```

**`TDeviceInfo` shape:**

```ts
type TDeviceInfo = {
    userAgent: string;
    screenWidth: number;        // screen.width
    screenHeight: number;       // screen.height
    viewportWidth: number;      // window.innerWidth
    viewportHeight: number;     // window.innerHeight
    devicePixelRatio: number;   // window.devicePixelRatio
    colorDepth: number;         // screen.colorDepth
    language: string;           // navigator.language
    hardwareConcurrency: number | null;  // CPU cores, null if unavailable
    deviceType: 'mobile' | 'tablet' | 'desktop';  // derived from UA + screenWidth
    connectionType: string | null;  // Network Info API effectiveType, null if unavailable
};
```

**What to change on backend:**
- Add `deviceInfo` column/field to the session or init record (optional — old clients won't send it)
- Index `deviceType` for filtering sessions by device category
- `connectionType` values: `"slow-2g"`, `"2g"`, `"3g"`, `"4g"`, or `null`

**What to change on rilog-local-server:**
- Accept and store `deviceInfo` from the request body alongside `events`, `uToken`, `appName`
- Include it in the `LogEntry` written to file
- See the dedicated prompt section below

---

## Deployment order

To avoid breaking the currently running system, deploy in this order:

1. **Backend:** Remove AES decryption, update schema for INPUT + console fields
2. **Publish new lib version** (`npm version patch` + `npm publish`)
3. **Frontend:** Add UI for INPUT events, enhanced console display, FATAL_REACT_ERROR styling

> Do not publish the new lib version before the backend is updated — old backend cannot parse unencrypted events.
