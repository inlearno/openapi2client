const TYPES = {
  string: 'string',
  integer: 'number',
  number: 'number',
  boolean: 'boolean'
}

let lastTypeIndex = 0
let generatedTypes = {}

export const cleanGeneratedTypes = () => {
  lastTypeIndex = 0
  generatedTypes = {}
}

export const getGeneratedTypes = () => {
  return generatedTypes
}

export const schemaToType = opts => {
  if (opts.type === 'object') {
    return generateType(opts.title || null, opts.properties)
  }
  if (opts.type === 'array') {
    return schemaToType(opts.items) + '[]'
  }
  if (opts.enum) {
    return opts.enum.map(k => `'${k}'`).join(' | ')
  }
  if (opts.type in TYPES) {
    return TYPES[opts.type]
  }
  if (opts.type in generatedTypes) {
    return opts.type
  }
  return 'any'
}

export const isRequired = opts => {
  return opts && (opts.required || opts.in === 'path')
}

export const getTypescriptTypeRow = (name, o) => {
  return `${name}${isRequired(o) ? '' : '?'}:${schemaToType(o)}`
}

export const generateTypeName = () => {
  lastTypeIndex++
  return `ApiType${lastTypeIndex}`
}

export const generateType = (name, properties) => {
  const props = Object.entries(properties)
    .map(property => getTypescriptTypeRow(...property))
    .join('\n')

  if (!name) {
    name = generateTypeName()
  }

  const code = `export type ${name} = {${props}}`
  if (name in generatedTypes && code !== generatedTypes[name]) {
    return generateType(`${name}${++lastTypeIndex}`, properties)
  }

  generatedTypes[name] = code
  return name
}

export const handleRootSchemas = schemas => {
  return Object.entries(schemas).map(([title, schema]) =>
    schemaToType({ type: 'object', title, ...schema })
  )
}
