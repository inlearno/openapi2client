import Case from 'case'
import { generateType, schemaToType, getGeneratedTypes } from './types'

export const combinePaths = paths => {
  return Object.entries(paths).reduce((groups, [url, op]) => {
    const { parameters = [], ...operations } = op
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

export const getActionResponseType = _cfg => {
  return 'any'
}

export const paramToSchema = ({ schema, ...param }) => {
  let type
  if (param.in === 'path') {
    type = 'string'
  } else if (schema) {
    type = schemaToType(schema)
  } else {
    type = 'any'
  }
  return { type }
}

export const paramsToProperties = params => {
  params //?
  return params.reduce((props, { name, ...param }) => {
    props[name] = paramToSchema(param)
    return props
  }, {})
}

export const combineActionParams = (name, params) => {
  const groups = params.reduce((groups, param) => {
    if (param.in) {
      groups[param.in] = [...(groups[param.in] || []), param]
    }
    return groups
  }, {})
  if (Object.keys(groups).length > 1) {
    const { path, ...paramGroups } = groups
    const res = Object.entries(paramGroups).map(([key, params]) => {
      const required = params.filter(p => p.required).length > 0
      return {
        name: key,
        schema: {
          type: generateType(name + Case.capital(key), paramsToProperties(params))
        },
        required
      }
    })
    params = [...path, ...res]
  }
  return paramsToProperties(params)
}

export const getActionParamsType = (name, cfg) => {
  const params = cfg.parameters || []
  if (!params.length) {
    return 'void'
  }
  name = Case.capital(name, '')
  if (params.length === 1) {
    return schemaToType(paramToSchema(params[0]))
  } else {
    return generateType(`${name}Params`, combineActionParams(name, params))
  }
}

export const getActionName = cfg => {
  return Case.camel(cfg.operationId || cfg.url)
}

export const getAction = cfg => {
  const name = getActionName(cfg)
  const urlConstant = 'URL_' + Case.constant(cfg.url).replace(/^_/, '')
  return {
    name,
    urlConstant,
    responseType: getActionResponseType(cfg),
    paramsType: getActionParamsType(name, cfg)
  }
}

export const getImportTypes = types => {
  const generated = getGeneratedTypes()
  types = types.filter((v, i, self) => self.indexOf(v) === i).filter(type => type in generated)
  return types.length > 0 ? `import {${types.join(', ')}} from '../types'` : ''
}

export const generateActionCode = action => {
  return `export const ${action.name} = createAsync<${action.paramsType}, ${action.responseType}, AxiosError>('LOAD', async () => {
    const { data } = await axios.get(${action.urlConstant})
    return data.data
  })`
}

export const generateAction = cfg => {
  const action = getAction(cfg)
  const code = generateActionCode(action)
  return {
    code,
    constanst: action.urlConstant,
    types: [action.responseType, action.paramsType]
  }
}

export const generateActionFileCode = (tag, pathGroup) => {
  const urlConstants = {}
  const importTypes = []
  const actions = pathGroup
    .map(cfg => {
      const { constanst, code, types } = generateAction(cfg)
      importTypes.push(...types)
      urlConstants[cfg.url] = constanst
      return code
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

      ${getImportTypes(importTypes)}

      const create = actionCreatorFactory('${tag}')
      const createAsync = asyncFactory(create)
  
      ${constants}
  
      ${actions}
    `
}
