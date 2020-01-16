#!/usr/bin/env node

'use strict';
const meow = require('meow')
const fetch = require('fetch')
const [,, ...args] = process.argv

const cli = meow(`
Usage
  $ openapi2client -s <schema> -o <dir>

Options
  --schema, -s  URL to openapi schema
  --output, -o  Folder for generated files
`, {
    flags: {
        schema: {
            alias: 's',
            type: 'string'
        },
        output: {
            alias: 'o',
            type: 'string'
        }
    }
})

if ( !cli.flags.schema || !cli.flags.output ) {
    console.log(cli.help);
    process.exit();
}
console.log(cli.flags)