#!/usr/bin/env node

'use strict';
require('dotenv').config()
const meow = require('meow')
const fetch = require('node-fetch')
const generate = require('./generator')
const [,, ...args] = process.argv

const cli = meow(`
Usage
  $ openapi2client -s <schema> -o <dir>

Options
  --schema, -s  URL to openapi schema (Only JSON)
  --output, -o  Folder for generated files
`, {
    flags: {
        schema: {
            alias: 's',
            type: 'string',
            default: process.env.OPENAPI_SCHEMA || ''
        },
        output: {
            alias: 'o',
            type: 'string'
        }
    }
})

if ( !cli.flags.schema || !cli.flags.output ) {
    cli.showHelp()
}

fetch(cli.flags.schema)
    .then(res => res.json())
    .then(json => generate(json, cli.flags))
    .catch(e => console.log(e.message))