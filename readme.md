![Rosalina](http://i.imgur.com/ZrIgvbN.png?1)

[A(nother)](https://cdn.shopify.com/s/files/1/0533/2089/files/javascript-frameworks-days.png?18059098111826468152) Node.js web framework with focus on [backend-for-frontend](https://www.thoughtworks.com/insights/blog/bff-soundcloud) (BFF) development.

## Still in development
Use at your own risk, expect falling bricks.

## How does it work?
Rosalina is mostly configuration-based. You define the body parameters and
headers to send to specific backend endpoints instead of declaring which actions
are made on a defined route.

An usage example can be found in the `demo.js` file.

## Installation
`npm install Chekosoft/Rosalina`

In the near future, it will be like `npm install rosalina`

## Why?
BFF development can be very tedious, specially when the BFF just passes parameters (95% of the time).

## Why Node.js?
Most of Backend-for-frontend work is done as
[frontend development](http://samnewman.io/patterns/architectural/bff/) using
Javascript as the main language on all web-based frontends.

## Requirements
- Node.js v6.3.1 (version of Node.js which Rosalina development started) or newer.

## TODO
- Map destination URL parameters
- File upload support
- Proper documentation
- Test suites
- Publish to NPM

## License
Rosalina is open source software licensed under the MIT license.
