const format = require('prettier-eslint')
const path = require('path')
const fs = require('fs')

const TYPES = {
  string: 'string',
  integer: 'number',
  number: 'number'
}

const formatCode = content => {
  return format({
    text: content,
    filePath: __dirname + '/file.ts'
  })
}

const saveFile = (path, content) => {
  fs.writeFileSync(path, formatCode(content))
}

const getPropertyType = (model, name, opts) => {
  if (opts.enum) {
    return opts.enum.map(k => `'${k}'`).join(' | ')
  }
  if (opts.type in TYPES) {
    return TYPES[opts.type]
  }
  throw new Error(`[${model}.${name}] ERROR: Not found type: ${opts.type}`)
}

const generateTypes = schemas => {
  return Object.entries(schemas)
    .map(([model, definition]) => {
      const props = Object.entries(definition.properties)
        .map(([name, opts]) => `${name}:${getPropertyType(model, name, opts)};`)
        .join('\n')
      return `export type ${model}Model = {${props}}`
    })
    .join('\n\n')
}

module.exports = (scheme, flags) => {
  const outputDir = path.isAbsolute(flags.output)
    ? flags.output
    : path.join(process.cwd(), flags.output)
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir)
  }
  if (scheme.components && scheme.components.schemas) {
    saveFile(path.join(outputDir, 'types.ts'), generateTypes(scheme.components.schemas))
  }
}
