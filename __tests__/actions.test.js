import {
  combinePaths,
  paramToSchema,
  paramsToProperties,
  getActionName,
  getActionParamsType,
  combineActionParams,
  generateActionCode,
  getCtx,
  getAction
} from '../src/generators/actions'
const schema = require('./fixtures/schema.json')

describe('Test actions module', () => {
  describe('Test combinePaths', () => {
    it('Should group paths by tag', () => {
      const res = combinePaths(schema.paths)
      expect(Object.keys(res).length).toEqual(3)
      expect(res.pets.length).toEqual(2)
      expect(res.games.length).toEqual(1)
      expect(res.default.length).toEqual(2)
    })
    it('Should combine parametrs', () => {
      const res = combinePaths({
        '/path/{id}': {
          parameters: [{ name: 'id', in: 'path' }],
          get: {
            parameters: [{ name: 'id', in: 'query' }]
          }
        }
      })
      expect(res.default[0].parameters.length).toEqual(2)
    })
  })
  describe('Text combineActionParams', () => {
    it('When have only one type make plain object', () => {
      const res = combineActionParams([
        {
          name: 'id',
          in: 'path'
        },
        {
          name: 'name',
          in: 'path'
        }
      ])
      expect(res).toEqual({ id: { type: 'string' }, name: { type: 'string' } })
    })
    it('When have two and more types', () => {
      getCtx().action = 'Test'
      const res = combineActionParams([
        {
          name: 'limit',
          in: 'query'
        },
        {
          name: 'type',
          in: 'path'
        }
      ])
      expect(res).toEqual({ type: { type: 'string' }, query: { type: 'TestQuery' } })
    })
  })
  describe('Test paramToSchema', () => {
    it('Type should be string for path params', () => {
      const res = paramToSchema({
        name: 'id',
        in: 'path'
      })
      expect(res.type).toEqual('string')
    })
    it('Type should be any for params witout schema', () => {
      const res = paramToSchema({
        name: 'limit'
      })

      expect(res.type).toEqual('any')
    })
    it('Type should be number', () => {
      const res = paramToSchema({
        name: 'limit',
        schema: {
          type: 'integer'
        }
      })
      expect(res.type).toEqual('number')
    })
  })
  describe('Test paramsToProperties', () => {
    it('Should combine params to props', () => {
      const res = paramsToProperties([
        { name: 'param1' },
        { name: 'param2', schema: { type: 'string' } }
      ])
      expect(Object.keys(res).length).toEqual(2)
      expect(res.param1.type).toEqual('any')
      expect(res.param2.type).toEqual('string')
    })
    it('Should combine empty params right', () => {
      const res = paramsToProperties([])
      expect(res).toEqual({})
    })
  })
  describe('Test getActionParamsType', () => {
    it('Void when no parametrs present', () => {
      const res = getActionParamsType()
      expect(res).toEqual('void')
    })
    it('When have single param should return its type', () => {
      const res = getActionParamsType([
        {
          name: 'param',
          in: 'path'
        }
      ])
      expect(res).toEqual('string')
    })
    it('When have more that one parametr create user type', () => {
      getCtx().action = 'Action'
      const res = getActionParamsType([
        {
          name: 'param1'
        },
        {
          name: 'param2'
        }
      ])
      expect(res).toEqual('ActionParams')
    })
  })
  describe('Test getActionName', () => {
    it('Should use operationid first', () => {
      const res = getActionName({
        operationId: 'test-operation',
        url: '/test'
      })
      expect(res).toEqual('testOperation')
    })
    it('Should use url', () => {
      const res = getActionName({
        url: '/pets/list'
      })
      expect(res).toEqual('petsList')
    })
  })
  describe('Test generateActionCode', () => {
    it('Simple config', () => {
      const action = getAction({
        operationId: 'test',
        method: 'get',
        url: '/test/path'
      })
      const code = generateActionCode(action)
      expect(code).toMatchSnapshot()
    })

    it('With path parametr', () => {
      const action = getAction({
        operationId: 'test',
        method: 'get',
        url: '/test/path',
        parameters: [
          {
            name: 'param',
            in: 'path'
          }
        ]
      })
      const code = generateActionCode(action)
      expect(code).toMatchSnapshot()
    })

    it('With query parametr', () => {
      const action = getAction({
        operationId: 'test',
        method: 'get',
        url: '/test/path',
        parameters: [
          {
            name: 'param',
            in: 'query'
          }
        ]
      })
      const code = generateActionCode(action)
      expect(code).toMatchSnapshot()
    })

    it('Post method', () => {
      const action = getAction({
        operationId: 'test',
        method: 'post',
        url: '/test/path',
        parameters: [
          {
            name: 'param',
            in: 'query'
          }
        ]
      })
      const code = generateActionCode(action)
      expect(code).toMatchSnapshot()
    })
  })
})
