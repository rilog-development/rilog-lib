# Rilog lib

**Simple way to log and debug your web apps.**

Rilog lib intercepts and stores different events such as requests, button clicks, console errors/warnings, and custom debug messages. Today, rilog-lib is adapted for [axios](https://www.npmjs.com/package/axios 'axios') and fetch.

## Intercepted events

| Event           | Trigger                           | Automatic |
| --------------- | --------------------------------- | --------- |
| `REQUEST`       | HTTP requests via axios or fetch  | ✓         |
| `CLICK`         | Clicks on `button`, `a` elements  | ✓         |
| `CONSOLE_ERROR` | `console.error()` calls           | ✓         |
| `CONSOLE_WARN`  | `console.warn()` calls            | ✓         |
| `DEBUG_MESSAGE` | Manual call via `rilog.logData()` | manual    |

## Table of Contents

---

-   [Installation and usage](#installation-and-usage)
-   [Debug messages](#debug-messages)
-   [Console interception](#console-interception)
-   [Storing to your server](#your-server)
-   [Config](#config)
-   [Examples](#examples)

## Installation and usage

---

### Installing

`yarn add @rilog-development/rilog-lib`

or

`npm i @rilog-development/rilog-lib`

### Get your app key

Before initializing the library, create a project in the Rilog app and copy its **app key**. Pass this key to `rilog.init()` — it links events from your application to your project in the storage.

```javascript
rilog.init({ key: 'your-app-key' });
```

### Usage (axios)

1. Import Rilog object from lib.

```javascript
import rilog from '@rilog-development/rilog-lib';
```

2. Init Rilog with your app key

```javascript
rilog.init({ key: 'your-app-key' });
```

3. Set up your axios [instance](https://www.npmjs.com/package/axios#creating-an-instance 'instance') and [interceptors](https://www.npmjs.com/package/axios#interceptors 'interceptors'). Add `interceptRequestAxios` and `interceptResponseAxios` functions.

```javascript
// request interceptor
instance.interceptors.request.use(async function (request) {
    // Your axios instance

    rilog.interceptRequestAxios(request);

    return Promise.resolve(request);
});
// response interceptor
instance.interceptors.response.use(
    function (response) {
        rilog.interceptResponseAxios(response);

        return Promise.resolve(response);
    },
    function (error) {
        rilog.interceptResponseAxios(error);

        return Promise.reject(error);
    },
);
```

### Usage (fetch)

By default Rilog lib intercepts all fetch requests automatically when you call `rilog.init()`. You can disable fetch interception by passing `disableFetchInterceptor: true` to `config`.

## Debug messages

---

Use `rilog.logData()` as a replacement for `console.log` — it sends custom messages to your storage instead of (or in addition to) the browser console.

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

## Console interception

---

After calling `rilog.init()`, Rilog automatically overrides `console.warn` and `console.error`. Every call to these methods is intercepted and stored as an event — no extra code needed.

Each captured console event contains:

-   **level** — `"warn"` or `"error"`
-   **message** — the serialized arguments passed to console
-   **stackTrace** — the call stack at the time of the call (requires source maps)

The original `console.warn` / `console.error` behavior is preserved — messages still appear in the browser DevTools as usual.

**Disabling console interception:**

```javascript
rilog.init({
    config: {
        disableConsoleInterceptor: true,
    },
});
```

## Your server

---

You can use your own server for storing intercepted events. Create a `POST` endpoint and pass the `selfServer` with a `url` param to [config](#self-server-config).

Every time events are collected, Rilog lib calls your endpoint and passes events in the request body:

```typescript
{
    events: string;
}
```

The array of events is passed as a JSON string — parse it on the server side.

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

### Self server config

| Param   | Type                     | Required | Description                                     |
| ------- | ------------------------ | -------- | ----------------------------------------------- |
| url     | `string`                 | Yes      | URL of your `POST` endpoint for storing events. |
| headers | `Record<string, string>` | No       | Additional headers sent with each save request. |

## Config

---

Below is a list of all config params (`TRilogInitConfig`):

| Param                     | Type                                 | Description                                                                                |
| ------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------ |
| ignoredRequests           | `string[]`                           | URLs of requests that will not be stored.                                                  |
| sensetiveRequsts          | `string[]`                           | Requests whose headers and body will be replaced with `'sensitive'`.                       |
| sensetiveDataRequests     | `string[]`                           | Requests whose body only will be replaced with `'sensitive'` (e.g. card data).             |
| headers                   | `string[]`                           | Only these headers will be stored. By default no headers are stored.                       |
| localStorage              | `string[]`                           | Only these localStorage keys will be stored. By default no localStorage values are stored. |
| disableFetchInterceptor   | `boolean`                            | Disable automatic fetch interception.                                                      |
| disableClickInterceptor   | `boolean`                            | Disable automatic click interception on `button` and `a` elements.                         |
| disableConsoleInterceptor | `boolean`                            | Disable automatic `console.warn` / `console.error` interception.                           |
| selfServer                | [`ISelfServer`](#self-server-config) | Config for storing events to your own backend.                                             |
| onPushEvent               | `function(event) {}`                 | Callback fired each time an event is intercepted.                                          |
| onSaveEvents              | `function(events) {}`                | Callback fired before events are sent to storage.                                          |

## Examples

---

### Sensitive Requests

Hide sensitive card data for specific requests:

```javascript
rilog.init({
    config: {
        sensetiveDataRequests: ['/api/v1/pay/card', '/api/v1/send/card'],
    },
});
```

Store only axios requests (disable all other interception):

```javascript
rilog.init({
    config: {
        disableFetchInterceptor: true,
        disableClickInterceptor: true,
        disableConsoleInterceptor: true,
    },
});
```

Ignore specific requests:

```javascript
rilog.init({
    config: {
        ignoredRequests: ['https://some.test/request'],
    },
});
```

Store specific headers and localStorage values:

```javascript
rilog.init({
    config: {
        headers: ['Authorization'],
        localStorage: ['token', 'userId'],
    },
});
```

Intercept events with callbacks:

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
