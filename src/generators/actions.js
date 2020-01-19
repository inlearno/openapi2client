import Case from 'case'
import { generateType, schemaToType, getGeneratedTypes } from './types'

const actionsContext = {
  action: null,
  config: {}
}

export const getCtx = () => {
  return actionsContext
}

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
  return params.reduce((props, { name, ...param }) => {
    props[name] = paramToSchema(param)
    return props
  }, {}) //?
}

export const combineActionParams = params => {
  const name = getCtx().action
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

export const getActionParamsType = (params = []) => {
  if (!params.length) {
    return 'void'
  }
  if (params.length === 1) {
    return schemaToType(paramToSchema(params[0]))
  } else {
    return generateType(`${getCtx().action}Params`, combineActionParams(params))
  }
}

export const getActionName = cfg => {
  return Case.camel(cfg.operationId || cfg.url)
}

export const getActionMethod = (method = 'get') => {
  method = method.toLowerCase()
  switch (method) {
    case 'get':
    case 'post':
    case 'put':
    case 'delete':
    case 'update':
    case 'patch':
    case 'options':
      return method
    default:
      console.error(
        `[${getCtx().action}][${getCtx().config.url}] Method method='${method}' is not available`
      )
      return 'get'
  }
}

export const getAction = cfg => {
  getCtx().action = getActionName(cfg)
  getCtx().confg = cfg
  const urlConstant = 'URL_' + Case.constant(cfg.url).replace(/^_/, '')
  return {
    name: getCtx().action,
    method: (cfg.method || 'get').toLowerCase(),
    urlConstant,
    params: cfg.parameters,
    types: {
      response: getActionResponseType(cfg),
      params: getActionParamsType(cfg.parameters)
    }
  }
}

export const getImportTypes = types => {
  const generated = getGeneratedTypes()
  types = types.filter((v, i, self) => self.indexOf(v) === i).filter(type => type in generated)
  return types.length > 0 ? `import {${types.join(', ')}} from '../types'` : ''
}

export const generateActionCode = action => {
  const rows = []
  let hasPayload = false
  let urlVarName = action.urlConstant
  let pathParams = []
  let queryParams = []

  let payloadVarName = 'payload'
  if (action.params) {
    const getByType = type => action.params.filter(param => param.in === type)
    pathParams = getByType('path')
    queryParams = getByType('query')
    //query
  }
  if (pathParams && pathParams.length) {
    hasPayload = true
    urlVarName = 'url'
    if (pathParams.length === 1) {
      const param = pathParams[0]
      payloadVarName = param.name
      rows.push(`const url = format(${action.urlConstant}, {${param.name}})`)
    } else {
      const formatData = pathParams.map(param => ` ${param.name} `).join(', ')
      rows.push(`const {${formatData}} = ${payloadVarName}`)
      rows.push(`const url = format(${action.urlConstant}, {${formatData}})`)
    }
  }
  const secondParam = []
  const fnParams = [urlVarName]

  if (queryParams.length) {
    hasPayload = true
    rows.push(
      `const params = {${queryParams
        .map(p => `${p.name}: ${payloadVarName}.${p.name}`)
        .join(', ')}}`
    )
    secondParam.push('params')
  }
  if (secondParam.length) {
    fnParams.push(`{${secondParam.join(', ')}}`)
  }

  rows.push(`const { data } = await axios.${action.method}(${fnParams.join(', ')})`)
  rows.push(`return data.data`)
  return `export const ${action.name} = createAsync<${action.types.params}, ${
    action.types.response
  }, AxiosError>('LOAD', async (${hasPayload ? payloadVarName : ''}) => {
    ${rows.join('\n')}
  })` //?
}

export const generateActionFileCode = (tag, pathGroup) => {
  const urlConstants = {}
  const importTypes = []
  const actions = pathGroup
    .map(cfg => {
      const action = getAction(cfg)
      const { urlConstant, types } = action
      importTypes.push(...Object.values(types))
      urlConstants[cfg.url] = urlConstant
      return generateActionCode(action)
    })
    .join('\n\n')

  const constants = Object.entries(urlConstants)
    .map(([url, name]) => `const ${name} = '${url}'`)
    .join('\n')

  return `
      import axios from 'axios'
      import format from 'string-template'
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
