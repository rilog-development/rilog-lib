<div align="center">

> ## 🚀 Registration is now open!
> **[rilog.online](https://www.rilog.online)** is available for everyone. Create your account and start debugging today!
> ### **[👉 Sign up at rilog.online](https://www.rilog.online)**

---

# Rilog lib

**Simple way to log and debug your web apps.**

[![npm version](https://img.shields.io/npm/v/@rilog-development/rilog-lib?color=0d2b2b&labelColor=3ecfbf&style=flat-square)](https://www.npmjs.com/package/@rilog-development/rilog-lib)
[![npm downloads](https://img.shields.io/npm/dm/@rilog-development/rilog-lib?color=0d2b2b&labelColor=3ecfbf&style=flat-square)](https://www.npmjs.com/package/@rilog-development/rilog-lib)
[![TypeScript](https://img.shields.io/badge/TypeScript-ready-0d2b2b?labelColor=3ecfbf&style=flat-square)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-0d2b2b?labelColor=3ecfbf&style=flat-square)](LICENSE)

<br/>

> 📖 **[Full Documentation → docs.rilog.online](https://docs.rilog.online/docs/rilog-lib/overview)**

</div>

---

Rilog lib intercepts and stores different events such as HTTP requests (fetch, XHR, axios), button clicks, input changes, console errors/warnings, runtime exceptions, and custom debug messages.

---

## Get started in 3 steps

**1. Install**

```bash
npm i @rilog-development/rilog-lib
```

**2. Init with your app key**

```javascript
import rilog from '@rilog-development/rilog-lib';

rilog.init({ key: 'YOUR_APP_KEY' });
```

Optionally pass `meta` in `config` to enrich events with environment context:

```javascript
rilog.init({
    key: 'YOUR_APP_KEY',
    config: {
        meta: {
            environment: 'production',
            branch: 'main',
            framework: 'React 18.0.0',
            platform: 'Browser',
        },
    },
});
```

> Get your key by creating a project in the [Rilog app](http://www.rilog.online).

**3. Watch events flow in real-time**

Open the [Rilog dashboard](http://www.rilog.online) — HTTP requests, errors, clicks and custom events appear automatically.

---

## What gets captured

| | Event | Description | Automatic |
| --- | --- | --- | --- |
| 🌐 | `REQUEST` | HTTP requests via fetch | ✓ |
| 🌐 | `REQUEST` | HTTP requests via XMLHttpRequest | ✓ |
| 🌐 | `REQUEST` | HTTP requests via axios (with `wrapAxios`) | ✓ |
| 🖱️ | `CLICK` | Clicks on `button`, `a` elements | ✓ |
| ⌨️ | `INPUT` | Input field values on focus-out | ✓ |
| 🚨 | `CONSOLE_ERROR` | `console.error()`, uncaught exceptions, unhandled rejections | ✓ |
| ⚠️ | `CONSOLE_WARN` | `console.warn()` calls | ✓ |
| 📡 | `DEBUG_MESSAGE` | Manual call via `rilog.logData()` | manual |

## Framework compatibility

| Framework | Support |
| --- | --- |
| React 16+ | ✅ Full |
| Next.js | ✅ Full |
| Vue 2/3 | ✅ Full |
| Angular 12+ | ⚡ Partial |
| Svelte | ⚡ Partial |
| Plain HTML + JS | ✅ Full |

## Table of Contents

---

-   [Installation and usage](#installation-and-usage)
-   [Axios — wrapAxios](#axios--wrapaxios)
-   [XHR interception](#xhr-interception)
-   [Axios vs XHR strategy](#axios-vs-xhr-strategy)
-   [Input interception](#input-interception)
-   [Console interception](#console-interception)
-   [React ErrorBoundary](#react-errorboundary)
-   [Debug messages](#debug-messages)
-   [Storing to your server](#your-server)
-   [Config](#config)
-   [Meta](#meta)
-   [Examples](#examples)
-   [Contacts](#contacts)

## Installation and usage

---

### Installing

```bash
yarn add @rilog-development/rilog-lib
```

or

```bash
npm i @rilog-development/rilog-lib
```

### Get your app key

Before initializing the library, create a project in the [Rilog app](http://www.rilog.online) and copy its **app key**. Pass this key to `rilog.init()` — it links events from your application to your project in the storage.

```javascript
rilog.init({ key: 'your-app-key' });
```

### Init params

| Param  | Type               | Required | Description                                       |
| ------ | ------------------ | -------- | ------------------------------------------------- |
| key    | `string`           | No       | App key from your Rilog project.                  |
| config | `TRilogInitConfig` | No       | Behavioral configuration (see [Config](#config)). |

### Usage (fetch)

By default Rilog intercepts all `fetch` requests automatically when you call `rilog.init()`. No extra code needed.

You can disable it via config:

```javascript
rilog.init({
    config: { disableFetchInterceptor: true },
});
```

---

## Axios — wrapAxios

---

The recommended way to capture axios requests is `rilog.wrapAxios()`. Call it once after `rilog.init()`, passing your axios instance (default or custom).

```javascript
import axios from 'axios';
import rilog from '@rilog-development/rilog-lib';

rilog.init({ key: 'your-app-key', config: { disableXHRInterceptor: true } });

// Default axios instance
rilog.wrapAxios(axios);
```

With a custom instance:

```javascript
const api = axios.create({ baseURL: '/api' });

rilog.init({ key: 'your-app-key', config: { disableXHRInterceptor: true } });

rilog.wrapAxios(api);
```

`wrapAxios` automatically adds request and response interceptors, including **error responses (4xx / 5xx)**.

> **Why `disableXHRInterceptor: true`?** Axios uses XMLHttpRequest internally. Without this flag, axios requests are captured twice — once via `wrapAxios` and once via the automatic XHR interceptor. See [Axios vs XHR strategy](#axios-vs-xhr-strategy) for details.

### Manual axios interceptors (alternative)

If you prefer to control interceptors yourself:

```javascript
instance.interceptors.request.use((request) => {
    rilog.interceptRequestAxios(request);
    return Promise.resolve(request);
});

instance.interceptors.response.use(
    (response) => {
        rilog.interceptResponseAxios(response);
        return Promise.resolve(response);
    },
    (error) => {
        rilog.interceptResponseAxios(error);
        return Promise.reject(error);
    },
);
```

---

## XHR interception

---

Rilog automatically patches `window.XMLHttpRequest` and intercepts all XHR requests — including those from third-party libraries (jQuery, payment SDKs, upload libraries, etc.).

XHR interception is enabled by default. Disable it via config:

```javascript
rilog.init({
    config: { disableXHRInterceptor: true },
});
```

Captured events include: URL, method, request headers, request body (serialized), response status, and response text. `FormData` bodies are converted to plain objects. Binary bodies (`Blob`, `ArrayBuffer`) are represented as size descriptors.

---

## Axios vs XHR strategy

---

Because axios uses XHR (or fetch) internally, there is a potential for **double-capturing** the same request. Choose the approach that fits your project:

### App uses axios only

Use `wrapAxios` and disable XHR interception. You get better data quality (structured body, parsed JSON, full headers) with no duplicates.

```javascript
rilog.init({ key: 'your-app-key', config: { disableXHRInterceptor: true } });
rilog.wrapAxios(axios);
```

### App uses fetch only (no axios)

No extra configuration needed. Fetch is intercepted automatically.

```javascript
rilog.init({ key: 'your-app-key' });
```

### App uses axios + third-party libraries that use XHR

Use `wrapAxios` for axios and keep XHR interception active for third-party requests. Axios requests are captured twice in this case, but third-party XHR requests are covered.

```javascript
rilog.init({ key: 'your-app-key' }); // XHR stays active
rilog.wrapAxios(axios);              // axios also captured via adapter
```

### App uses no axios (only plain fetch / XHR)

Everything is captured automatically. No additional setup required.

```javascript
rilog.init({ key: 'your-app-key' });
```

### Data quality comparison

| | `wrapAxios` | Automatic XHR |
| --- | --- | --- |
| Request body | Structured object | Serialized string |
| Response body | Parsed JSON | Raw `responseText` |
| 4xx / 5xx responses | Via error handler | Via `loadend` event |
| Query params | From `config.params` | From URL only |

---

## Input interception

---

Rilog captures input field values when the user leaves a field (`focusout`). This works automatically in React, Next.js, and plain DOM apps — no extra configuration needed.

**What is captured:**

-   Element `id`, `name`, class names, node type, input type
-   Value at the time of focus-out

**Sensitive fields are masked automatically.** Fields with `type="password"` or `autocomplete` values like `cc-number`, `cc-csc`, `cc-exp`, `current-password`, `new-password` have their values replaced with `"*"`.

Disable input interception via config:

```javascript
rilog.init({
    config: { disableInputInterceptor: true },
});
```

---

## Console interception

---

After calling `rilog.init()`, Rilog automatically intercepts:

-   `console.error()` and `console.warn()` calls
-   **Uncaught runtime exceptions** via `window.onerror` — captures message, source file, line and column numbers, and stack trace
-   **Unhandled Promise rejections** via `window.addEventListener('unhandledrejection')` — captures the rejection reason and stack trace

If a `console.error()` argument is an `Error` object, its message and full stack trace are serialized correctly (not `[object Object]`).

Existing `window.onerror` handlers in your app are preserved — Rilog chains its handler and always calls the original.

Each captured console event includes:

-   **level** — `"warn"` or `"error"`
-   **message** — serialized arguments
-   **stackTrace** — call stack (requires source maps for readable references)
-   **source** — `"console"`, `"runtime"`, or `"unhandledRejection"`
-   **errorFile**, **errorLine**, **errorColumn** — available for runtime exceptions

The original `console.warn` / `console.error` behavior is preserved — messages still appear in DevTools.

**Disabling console interception:**

```javascript
rilog.init({
    config: { disableConsoleInterceptor: true },
});
```

---

## React ErrorBoundary

---

For React applications, Rilog provides a `RilogErrorBoundary` component that catches errors in the React component tree (via `componentDidCatch`) and sends them to Rilog with the label `FATAL_REACT_ERROR`.

```jsx
import rilog from '@rilog-development/rilog-lib';
import { RilogErrorBoundary } from '@rilog-development/rilog-lib/dist/react/RilogErrorBoundary';

rilog.init({ key: 'your-app-key' });

function App() {
    return (
        <RilogErrorBoundary rilog={rilog} fallback={<div>Something went wrong.</div>}>
            <YourApp />
        </RilogErrorBoundary>
    );
}
```

The captured event includes the error `message`, `stack`, and React's `componentStack` — making it easy to identify which component caused the crash.

`RilogErrorBoundary` props:

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| rilog | `IRilog` | Yes | The rilog instance. |
| children | `ReactNode` | Yes | The component tree to protect. |
| fallback | `ReactNode` | No | UI to render when an error is caught. |

---

## Last Gasp — sending events before page close

---

When the page is about to close or navigate away, Rilog automatically flushes any pending events that haven't been sent yet. This ensures that events leading up to a crash or navigation are not lost.

-   For `selfServer` and `localServer` modes: uses `navigator.sendBeacon` (non-blocking, guaranteed delivery even after page close)
-   For Rilog cloud: uses `fetch` with `keepalive: true` (supports the `Authorization` header)

This behavior is automatic and requires no configuration.

---

## Debug messages

---

Use `rilog.logData()` as a replacement for `console.log` — it sends custom messages to your storage.

```javascript
rilog.logData(data, { label });
```

| Param | Type     | Required | Description                                                                    |
| ----- | -------- | -------- | ------------------------------------------------------------------------------ |
| data  | `any`    | Yes      | Any value — string, object, number, etc. Objects are serialized automatically. |
| label | `string` | Yes      | A label for filtering events in your storage (e.g. component name).            |

The event also automatically captures a **stack trace** from the call site (requires source maps to be enabled in your application for readable file/line references).

**Examples:**

```javascript
// Simple string message
rilog.logData('User submitted the form', { label: 'CheckoutForm' });

// Object
rilog.logData({ userId: 123, step: 'payment' }, { label: 'CheckoutForm' });
```

**Wrapper utility (recommended for large projects):**

```javascript
// src/utils/debug.ts
import rilog from '@rilog-development/rilog-lib';

export const debug = (data: unknown, label: string) => {
    rilog.logData(data, { label });
};
```

```javascript
// In any component
import { debug } from '@/utils/debug';

debug({ userId, step: 'payment' }, 'CheckoutForm');
```

---

## Your server

---

You can use your own server for storing intercepted events. Create a `POST` endpoint and pass the `selfServer` config with a `url` param.

Every time events are collected, Rilog calls your endpoint with the following body:

```typescript
{
    events: string; // JSON string — parse it on the server side
}
```

**Example:**

```javascript
rilog.init({
    config: {
        selfServer: {
            url: 'https://your-backend.com/api/events/save',
            headers: { Authorization: 'Bearer your-token' },
        },
    },
});
```

The endpoint must respond with:

```json
{ "result": "success" }
```

Events are cleared from storage only after receiving a successful response.

### Self server config

| Param   | Type                     | Required | Description                                     |
| ------- | ------------------------ | -------- | ----------------------------------------------- |
| url     | `string`                 | Yes      | URL of your `POST` endpoint for storing events. |
| headers | `Record<string, string>` | No       | Additional headers sent with each save request. |

---

## Config

---

Full list of `TRilogInitConfig` options:

| Param | Type | Description |
| --- | --- | --- |
| `ignoredRequests` | `string[]` | URLs of requests that will not be stored. |
| `sensetiveRequsts` | `string[]` | Requests whose headers and body will be replaced with `"sensitive"`. |
| `sensetiveDataRequests` | `string[]` | Requests whose body only will be replaced with `"sensitive"` (e.g. card data). |
| `headers` | `string[]` | Only these headers will be stored. By default no headers are stored. |
| `localStorage` | `string[]` | Only these localStorage keys will be captured per request snapshot. |
| `disableFetchInterceptor` | `boolean` | Disable automatic `fetch` interception. |
| `disableXHRInterceptor` | `boolean` | Disable automatic `XMLHttpRequest` interception. Set to `true` when using `wrapAxios`. |
| `disableClickInterceptor` | `boolean` | Disable automatic click interception on `button` and `a` elements. |
| `disableConsoleInterceptor` | `boolean` | Disable automatic `console.warn` / `console.error` interception. |
| `disableInputInterceptor` | `boolean` | Disable automatic input field value capture on focus-out. |
| `selfServer` | [`ISelfServer`](#self-server-config) | Config for storing events to your own backend. |
| `localServer` | `ILocalServerConfig` | Config for storing events to a local rilog-local-logger instance. |
| `onPushEvent` | `(event) => void` | Callback fired each time an event is intercepted. |
| `onSaveEvents` | `(events) => void` | Callback fired before events are sent to storage. |
| `meta` | [`TExternalInfoMeta`](#meta) | Environment metadata attached to every session. |

> For detailed configuration examples and advanced usage, see the **[full documentation](https://docs.rilog.online/docs/rilog-lib/overview)**.

---

## Meta

---

The `meta` object lets you attach environment context to each session. All fields are optional.

| Field       | Type     | Example                      |
| ----------- | -------- | ---------------------------- |
| environment | `string` | `"production"`, `"staging"`  |
| branch      | `string` | `"main"`, `"feat/my-branch"` |
| framework   | `string` | `"React 18.0.0"`             |
| platform    | `string` | `"Browser"`, `"Node.js 20"` |

```javascript
rilog.init({
    key: 'your-app-key',
    config: {
        meta: {
            environment: process.env.NODE_ENV,
            branch: 'main',
            framework: 'React 18.0.0',
            platform: 'Browser',
        },
    },
});
```

---

## Examples

---

### React app with axios

```javascript
import axios from 'axios';
import rilog from '@rilog-development/rilog-lib';

rilog.init({
    key: 'your-app-key',
    config: {
        disableXHRInterceptor: true,
        meta: { environment: process.env.NODE_ENV, framework: 'React 18' },
    },
});

rilog.wrapAxios(axios);
```

### Next.js app

```javascript
// app/providers.tsx or pages/_app.tsx
import rilog from '@rilog-development/rilog-lib';

rilog.init({
    key: 'your-app-key',
    config: {
        disableXHRInterceptor: true,
        meta: { environment: process.env.NODE_ENV, framework: 'Next.js 14' },
    },
});

rilog.wrapAxios(axios);
```

### React app with ErrorBoundary

```jsx
import rilog from '@rilog-development/rilog-lib';
import { RilogErrorBoundary } from '@rilog-development/rilog-lib/dist/react/RilogErrorBoundary';

rilog.init({ key: 'your-app-key', config: { disableXHRInterceptor: true } });
rilog.wrapAxios(axios);

export default function App() {
    return (
        <RilogErrorBoundary rilog={rilog} fallback={<div>Oops, something broke.</div>}>
            <Router />
        </RilogErrorBoundary>
    );
}
```

### Self-hosted backend (Cloudflare Worker, custom server)

```javascript
rilog.init({
    config: {
        selfServer: {
            url: 'https://your-worker.your-subdomain.workers.dev/events/save',
        },
        disableXHRInterceptor: true,
    },
});

rilog.wrapAxios(axios);
```

### Sensitive Requests

```javascript
rilog.init({
    config: {
        sensetiveDataRequests: ['/api/v1/pay/card', '/api/v1/send/card'],
    },
});
```

### Ignored requests

```javascript
rilog.init({
    config: {
        ignoredRequests: ['https://analytics.example.com', '/api/health'],
    },
});
```

### Capture specific headers and localStorage values

```javascript
rilog.init({
    config: {
        headers: ['Authorization', 'X-Request-Id'],
        localStorage: ['token', 'userId'],
    },
});
```

### Event callbacks

```javascript
rilog.init({
    config: {
        onPushEvent: (event) => {
            console.log('New event intercepted:', event);
        },
        onSaveEvents: (events) => {
            console.log('Sending events to storage:', events);
        },
    },
});
```

---

## Contacts

---

If you have any questions, feel free to reach out:

-   **Rilog app contact form:** [rilog.online/auth/contact](https://www.rilog.online/auth/contact)
-   **Email:** [kaowebdev@gmail.com](mailto:kaowebdev@gmail.com)
-   **LinkedIn:** [andrii-karnaukh-webdev](https://www.linkedin.com/in/andrii-karnaukh-webdev/)
