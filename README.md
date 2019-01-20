Javascript microservice configuration module
--------------------------------------------

[![Build Status](https://travis-ci.org/microparts/configuration-js.svg?branch=master)](https://travis-ci.org/microparts/configuration-js)

Configuration module for microservices written on TypeScript. Specially created
for follow up corporate standards of application configuration.


Available usage in browsers*.

## Installation

```bash
npm install --save @microparts/configuration-js

yarn add @microparts/configuration-js
```

## Usage

By default path to configuration directory and application stage
loading from `/app/configuration` with `local` stage.

1) Simple
```ts
import { Configuration } from '@microparts/configuration-js';

const conf = new Configuration();
conf.load();

console.log(conf.all()); // get all config
console.log(conf.get('foo.bar')); // get nested key use dot notation
```

2) If u would like override default values, you can pass 2 arguments to
class constructor or set up use setters.

```ts
import { Configuration } from '@microparts/configuration-js';

const conf = new Configuration('./configuration', 'test');
// or
// conf.path = './configs';
// conf.stage = 'local';
conf.load();

conf.get('foo'); // full example on the top
```

3) If the operating system has an env variables `CONFIG_PATH` and `STAGE`,
then values for the package will be taken from there.

```bash
export CONFIG_PATH=/configuration
export STAGE=prod
```

```ts
import { Configuration } from '@microparts/configuration-js';

const conf = new Configuration('./configuration', 'test');
conf.load(); // loaded files from /configuration for prod stage.

conf.get('foo'); // full example on the top
```

4) If u want to see logs and see how load process working,
pass you logger to property:

First, install logger (winston supported by default):
```bash
npm install --save winston

yarn add winston
```

Second, pass you logger to property like this:
```ts
import { Configuration, WinstonConsoleLogger, StdoutConsoleLogger } from '@microparts/configuration-js';

const conf = new Configuration();
conf.logger = new WinstonConsoleLogger(winston.createLogger({
  transports: [new winston.transports.Console()]
}));

// or

conf.logger = new StdoutConsoleLogger();
conf.load();

conf.get('foo'); // full example on the top
```

Also, your can pass any logger who implements library `LoggerInterface`.

## How to usage library with SPA apps?

It simple. Step by step:

1. Create an vue app for example
```bash
vue create vue-app
```
2. Install this package
```bash
yarn add @microparts/configuration-js
```
3. Put config files [like this](./example/vue-app/configuration)
4. Change `vue.config.js` to build final config to global variables:
```js
const { Configuration, StdoutConsoleLogger } = require('@microparts/configuration-js');

module.exports = {
  lintOnSave: false,
  chainWebpack: config => {
    config.plugin('html').tap(options => {
      const conf = new Configuration();
      conf.logger = new StdoutConsoleLogger();
      conf.load();

      options[0].__config = JSON.stringify(conf.all());
      options[0].__stage = conf.stage;

      return options;
    });
  }
};
```
5. Add following code to `index.html` to head of `<head>` html tag:
```html
<head>
  <% if (htmlWebpackPlugin.options.__stage === 'local') { %>
    <script>
      window.__config = JSON.parse('<%= htmlWebpackPlugin.options.__config %>');
      window.__stage = '<%= htmlWebpackPlugin.options.__stage %>';
      window.__vcs = '';
    </script>
  <% } %>
<!-- ... meta tags and other code -->
```
6. Change `serve` script in the `packages.json` file.
```bash
# "serve": "CONFIG_PATH=./configuration vue-cli-service serve",
```
7. Run application.
```bash
yarn serve
```

Full example available [here](./example/vue-app).

**Note:** <br>
https://github.com/microparts/static-server-php is required for server usage.

## License

The MIT License

Copyright © 2019 teamc.io, Inc. https://teamc.io

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
