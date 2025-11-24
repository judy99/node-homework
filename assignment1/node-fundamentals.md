# Node.js Fundamentals

## What is Node.js?

Node.js is an open-source, cross-platform runtime environment that allows you to execute JavaScript code outside of a web browser.

In simple terms, Node.js is a program without a graphical user interface — you interact with it through the command line, and it enables you to run JavaScript on the server side.

It is commonly used to build highly scalable, fast, data-intensive, and real-time backend services, and it’s easy to get started with.

## How does Node.js differ from running JavaScript in the browser?

Node.js does not include many of the features provided by browsers, such as the DOM (document, window), web storage (localStorage and sessionStorage), network functions like fetch, and other browser-specific APIs. These features do not exist in the Node.js environment.
Unlike the browser, Node.js provides a global object that offers numerous functions and properties for controlling the runtime environment. It also gives access to the file system, process information, operating system services, and networking APIs.
Additionally, Node.js supports command-line tools and allows for the secure storage and management of secrets.

## What is the V8 engine, and how does Node use it?

The V8 engine is an open-source JavaScript engine. It is used in the Google Chrome browser and in Node.js.

Its main job is to execute JavaScript code — by parsing, compiling, and then running it efficiently.

## What are some key use cases for Node.js?

- to build backend services that handle API requests and responses
- for real-time applications that require instant data updates (WebSockets, Socket.IO)
- to build cross-platform command-line tools

## Explain the difference between CommonJS and ES Modules. Give a code example of each.

In **JavaScript**, every file is a module. Modules are used to organize the codebase, divide responsibilities between different parts of an application, and make code easier to maintain and reuse.
JavaScript has two main module systems:

- **CommonJS (CJS)** (Node.js and other JavaScript runtimes)
- **ES Modules (ESM)** (browsers, Node.js, and other JavaScript runtimes)

CommonJS was created for Node.js before ES Modules were introduced. It loads modules synchronously, while ES Modules load asynchronously. They also differ in their syntax for importing and exporting:

- CommonJS uses require() and module.exports
- ES Modules use import and export

When to use each:

- **CommonJS:** old Node.js projects or projects with libraries that must support CommonJS, some other JavaScript runtimes
- **ES Modules:** modern Node.js projects, browsers (frontend code), some other JavaScript runtimes (Deno, Bun, QuickJS, ...)

**CommonJS (default in Node.js):**

```js
// math.js
function add(a, b) {
  return a + b;
}
function multiply(a, b) {
  return a * b;
}

// export an object with multiple functions
module.exports = { add, multiply };
```

```js
// calculator.js - two ways of importing
// 1. destructured import
const { add, multiply } = require("../path/to/math/module");
console.log(add(1, 2));
console.log(multiply(2, 2));

// 2. import as an object
const math = require("../path/to/math/module");
console.log(math.add(1, 2));
```

**ES Modules (supported in modern Node.js):**

```js
// math.js - default export
function add(a, b) {
  return a + b;
}

function multiply(a, b) {
  return a * b;
}

export default { add, multiply };
```

```js
// calculator.js - default import
import math from "../path/to/math/module";
console.log(math.add(1, 2));
```

```js
// math.js - named export
export function add(a, b) {
  return a + b;
}

export function multiply(a, b) {
  return a * b;
}
```

```js
// calculator.js - destructured import
import { add, multiply } from "../path/to/math/module";
console.log(add(1, 2));
console.log(multiply(2, 2));
```
