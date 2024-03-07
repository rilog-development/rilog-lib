# Rilog lib
**Simple way to log and debug your web apps.**


Rilog lib intercepts and stores different events such as requests, button clicks, client custom messages (instead of using console.log), etc.
Today, rilog-lib is adapted for [axios](https://www.npmjs.com/package/axios "axios") and fetch.

## Table of Contents
___
- [Installation and usage](#installing)
- [Storing to local server](#local-server)
- [Storing to your server](#your-server)
- [Config](#config)
- [Examples](#examples)

## Installation and usage
___

### Installing
`yarn add @rilog-development/rilog-lib`

or

`npm i @rilog-development/rilog-lib`

### Usage (axios)

1. Import Rilog object from lib.

```javascript
import rilog from '@rilog-development/rilog-lib';
```
2. Init Rilog and set up config

```javascript
rilog.init();
```
4. Set up your axios [instance](https://www.npmjs.com/package/axios#creating-an-instance "instance") and [interceptors](https://www.npmjs.com/package/axios#interceptors "interceptors"). Add ```interceptRequestAxios``` and ```interceptResponseAxios``` functions.

```javascript
// request interceptor
instance.interceptors.request.use(async function (request) { // Your axios instance

    rilog.interceptRequestAxios(request);

    return Promise.resolve(request);
});
// response interceptor
instance.interceptors.response.use(function(response) {

    rilog.interceptResponseAxios(response);

    return Promise.resolve(response);
}, function(error) {

    rilog.interceptResponseAxios(error);
    
    return Promise.reject(error);
})
```

### Usage (fetch)

By default Rilog lib intercept all fetch requests when you call `rilog.init()` method. But, you can disable fetch interception with passing `disableFetchInterceptor: true` to `config`.
## Local server
___
You can store your log data offline on your drive with Rilog [local-server](https://github.com/rilog-development/local-server). It's very useful, because you can store as many logs data as your drive allows you.

Install and launch the [local-server](https://github.com/rilog-development/local-server) on your device for local storing events. Local-server would launch on `http://localhost:2525`. The Rilog lib will send events to local-server.

Then define in config `localServer` with `appName`. (Look at localServer [config](#local-server-config)) The Rilog local-server will create folder for project (using app name) and log file (using current date and unique client token).

Example: 

```javascript
config: {
        localServer: {
            appName: "Rilog test lib"
        }
    }
```
Also, you can pass any additional `params` for your app. They would be written to you log file. In this example we pass an environment info and a current build type:
```javascript
config: {
        localServer: {
            appName: "Rilog test lib",
            params: {
                env: "dev",
                build: "uat"
            }
        }
    }
```

### Local Server Config

Below is a list of local server config params (ILocalServerConfig):

| Param   | Type                                     | Required | Definition                                          |
|---------|------------------------------------------|----------|-----------------------------------------------------|
| appName | string                                   | Yes      | App name would be used for creating project folder. |
| params | any | No       | Any additional params for storing in log file.      |



## Your server
___

You can use your own server for storing intercepted events. You should create a `POST` method and pass the `selfServer` with `url` param to [config](#self-server-config). 
Every time when events were collected the Rilog lib would call your `POST` method and pass events to body:
```typescript
    { events: string }
```
The array of events would be passed as JSON string to the method. So, you should parse it. 


### Self server config

| Param   | Type                   | Required | Definition                                                       |
|---------|------------------------|----------|------------------------------------------------------------------|
| url | string                 | Yes      | The url of your own backend endpoint (`POST`) for storing events. |
| headers        | Record<string, string> | No       | Additional headers for storing events endpoint.                  |

Below is a list of self server config params:

## Config
___

Below is a list of config params:

| Param | Type                                     | Definition                                                                                                   |
|-------|------------------------------------------|--------------------------------------------------------------------------------------------------------------|
| ignoredRequests| string[]                                 | Urls of requests that would be ignored. The rilog lib wouldn't store events for this events.                 |
| sensetiveRequsts | string[]                                 | The request headers and data wouldn't be stored. Headers and data would be replaced with 'sensetive' string. |
| sensetiveDataRequests | string[]                                 | The request data wouldn't be stored. Data would be replaced with 'sensetive' string.                         |
| headers | string[]                                 | Only this headers would be stored. By default rilog-lib doesn't store requests with all headers.             |
| localStorage | string[]                                 | Only this localStorage values would be stored. By default rilog-lib doesn't store all local storage values.  |
| disableFetchInterceptor | boolean                                  | Disable fetch interception.                                                                                  |
| disableClickInterceptor | boolean                                  | Disable click interception.                                                                                  |
| localServer | [ILocalServerConfig](#local-server-config) | Config for storing events to local server.                                                                   |
| selfServer | [ISelfServer](#self-server-config)       | Config for storing events to your custom backend.                                                            |
| onPushEvent  | function(event) {}                 | Push event call back. It calls when some event is intercepted.                                               |                                                                                                             |
| onSaveEvents      | function(events) {}               | Save events call back. It calls before evets would be sent to any storage.                                   |


## Examples
___

### Sensetive Requests

Imagine if you need to hide  sensitive card data for few request:

```javascript
rilog.init({
    config: {
        sensetiveDataRequests: ['/api/v1/pay/card', '/api/v1/send/card']
    }
});
```

You are interested in storing only axios requests:

```javascript
rilog.init({
    config: {
        disableFetchInterceptor: true,
        disableClickInterceptor: true
    }
});
```

You need to ignore some request:

```javascript
rilog.init({
    config: {
        ignoredRequests: ['https://some.test/request'],
    }
});
```
Store some headers in request events and some values from local storage:
```javascript
rilog.init({
    config: {
        headers: ['Authorization'],
        localStorage: ['token', 'userId']
    }
});
```
