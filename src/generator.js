import format from 'prettier-eslint'
import path from 'path'
import fs from 'fs'
import Case from 'case'

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
  const actionsDir = path.join(outputDir, 'actions')

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir)
  }
  if (!fs.existsSync(actionsDir)) {
    fs.mkdirSync(actionsDir)
  }
}

export const getActionResponseType = _cfg => {
  return 'any'
}

export const getActionName = cfg => {
  return Case.camel(cfg.operationId || cfg.url)
}

export const generateAction = (name, group) => {
  name = Case.constant(name)
  const urlConstants = {}
  const actions = group
    .map(cfg => {
      const actionName = getActionName(cfg)
      const actionResponseType = getActionResponseType(cfg)
      urlConstants[cfg.url] = 'URL_' + Case.constant(cfg.url).replace(/^_/, '')

      return `export const ${actionName} = createAsync<void, ${actionResponseType}, AxiosError>('LOAD', async () => {
      const { data } = await axios.get(${urlConstants[cfg.url]})
      return data.data
    })`
    })
    .join('\n\n')

  const constants = Object.entries(urlConstants)
    .map(([url, name]) => `const ${name} = '${url}'`)
    .join('\n')

  return `
    import axios from 'axios'
    import actionCreatorFactory from 'typescript-fsa'
    import { asyncFactory } from 'typescript-fsa-redux-thunk'
    import { AxiosError } from 'axios'
    const create = actionCreatorFactory('${name}')
    const createAsync = asyncFactory(create)

    ${constants}

    ${actions}
  `
}

export default (scheme, opts) => {
  init(opts)
  if (scheme.components && scheme.components.schemas) {
    saveFile('types.ts', generateTypes(scheme.components.schemas))
  }
  if (scheme.paths) {
    const pathsGroups = combinePaths(scheme.paths)
    Object.entries(pathsGroups).map(([name, group]) => {
      const content = generateAction(name, group)
      saveFile(`actions/${name}.ts`, content)
    })
  }
}
