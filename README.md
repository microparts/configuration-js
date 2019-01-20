Javascript microservice configuration module
--------------------------------------------

Configuration module for microservices written on TypeScript. Specially created
for follow up corporate standards of application configuration.

## Installation

```bash
npm install --save configuration-js

yarn add configuration-js
```

## Usage

By default path to configuration directory and application stage
loading from `/app/configuration` with `local` stage.

1) Simple
```ts
import Configuration from 'configuration-js';

const conf = new Configuration();
conf.load();

console.log(conf.all()); // get all config
console.log(conf.get('foo.bar')); // get nested key use dot notation
```

2) If u would like override default values, you can pass 2 arguments to
class constructor or set up use setters.

```php
import Configuration from 'configuration-js';

const conf = new Configuration('./configuration', 'test');
conf.load();

conf.get('foo'); // full example on the top
```

3) If the operating system has an env variables `CONFIG_PATH` and `STAGE`,
then values for the package will be taken from there.

```bash
export CONFIG_PATH=/configuration
export STAGE=prod
```

```php
import Configuration from 'configuration-js';

const conf = new Configuration('./configuration', 'test');
conf.load(); // loaded files from /configuration for prod stage.

conf.get('foo'); // full example on the top
```

4) If u want to see logs and see how load process working,
pass you logger to property:

First, install logger (winston supported bu default):
```bash
npm install --save winston

yarn add winston
```

Second, pass you logger to property like this:
```ts
import Configuration from 'configuration-js';
import WinstonConsoleLogger from 'configuration-js/winston-console-logger';

const conf = new Configuration();
conf.logger = new WinstonConsoleLogger(winston.createLogger({
  transports: [new winston.transports.Console()]
}));

conf.load();

conf.get('foo'); // full example on the top
```

Also, your can pass any logger who implements library `LoggerInterface`.

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
