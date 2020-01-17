import format from 'prettier-eslint'
import path from 'path'
import fs from 'fs'

const TYPES = {
  string: 'string',
  integer: 'number',
  number: 'number',
  boolean: 'boolean'
}

let outputDir

export const formatCode = content => {
  return format({
    text: content,
    filePath: __dirname + '/file.ts'
  })
}

const saveFile = (file, content) => {
  fs.writeFileSync(path.join(outputDir, file), formatCode(content))
}

export const toTypescriptType = (opts = {}) => {
  if (opts.enum) {
    return opts.enum.map(k => `'${k}'`).join(' | ')
  }
  if (opts.type in TYPES) {
    return TYPES[opts.type]
  }
  throw new Error(`Not found type${opts && opts.type ? ': ' + opts.type : ''}`)
}

export const isRequired = opts => {
  return opts && opts.required
}

export const getTypescriptTypeRow = (name, o) => {
  try {
    return `${name}${isRequired(o) ? '' : '?'}:${toTypescriptType(o)}`
  } catch (e) {
    throw new Error(`[${name}] ${e.message}`)
  }
}

export const generateType = (model, definition) => {
  const props = Object.entries(definition.properties)
    .map(property => getTypescriptTypeRow(...property))
    .join('\n')
  return `export type ${model}Model = {${props}}`
}

export const generateTypes = schemas => {
  return Object.entries(schemas)
    .map(entry => generateType(...entry))
    .join('\n\n')
}

export const combinePaths = paths => {
  return Object.entries(paths).reduce((groups, [url, op]) => {
    const { parameters = [], ...operations } = op
    op //?
    Object.entries(operations).forEach(([method, config]) => {
      const tag = config.tags && config.tags.length > 0 ? config.tags[0] : 'default'
      if (!(tag in groups)) {
        groups[tag] = []
      }
      config.parameters = config.parameters || []
      config.parameters = [...parameters, ...config.parameters]
      config.method = method
      config.url = url
      groups[tag].push(config)
    })
    return groups
  }, {})
}

export const getOutputDir = output => {
  return path.isAbsolute(output) ? output : path.join(process.cwd(), output)
}

export const init = options => {
  outputDir = getOutputDir(options.output)

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir)
  }
}

export default (scheme, opts) => {
  init(opts)
  if (scheme.components && scheme.components.schemas) {
    saveFile('types.ts', generateTypes(scheme.components.schemas))
  }
  if (scheme.paths) {
    const paths = combinePaths(scheme.paths)
    paths //?
  }
}
