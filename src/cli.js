#!/usr/bin/env node
'use strict'

import dotenv from 'dotenv'
import meow from 'meow'
import fetch from 'node-fetch'
import generate from './generator.js'

dotenv.config()

const cli = meow(
  `
Usage
  $ openapi2client -s <schema> -o <dir>

Options
  --schema, -s  URL to openapi schema (Only JSON)
  --output, -o  Folder for generated files
`,
  {
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
  }
)

if (!cli.flags.schema || !cli.flags.output) {
  cli.showHelp()
}

fetch(cli.flags.schema)
  .then(res => res.json())
  .then(json => generate(json, cli.flags))
  .catch(e => {
    throw e
  })
