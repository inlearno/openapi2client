import {
  schemaToType,
  getTypescriptTypeRow,
  cleanGeneratedTypes,
  getGeneratedTypes,
  generateType
} from '../src/generators/types'

describe('Test types module', () => {
  afterEach(() => {
    cleanGeneratedTypes()
  })
  describe('Test schemaToType', () => {
    it('Should return string', () => {
      const res = schemaToType({
        type: 'string'
      })
      expect(res).toEqual('string')
    })
    it('Should return number', () => {
      const res = schemaToType({
        type: 'number'
      })
      expect(res).toEqual('number')
      const res2 = schemaToType({
        type: 'integer'
      })
      expect(res2).toEqual('number')
    })
    it('Should return boolean', () => {
      const res = schemaToType({
        type: 'boolean'
      })
      expect(res).toEqual('boolean')
    })
    describe('Should return any', () => {
      it('With empty type', () => {
        const res = schemaToType({})
        expect(res).toEqual('any')
      })
      it('With bad type', () => {
        const res = schemaToType({ type: 'notexisttype' })
        expect(res).toEqual('any')
      })
    })
    it('Should return literals for enum fields', () => {
      const res = schemaToType({
        enum: ['text1', 'text2']
      })
      expect(res).toEqual(`'text1' | 'text2'`)
    })
    it('Should create new type', () => {
      const typeName = schemaToType({
        type: 'object',
        properties: {
          name: {
            type: 'string'
          }
        }
      })
      const generated = Object.keys(getGeneratedTypes())
      expect(generated.length).toEqual(1)
      expect(generated).toContainEqual(typeName)
    })
    it('Should generate type with subobject', () => {
      const typeName = schemaToType({
        type: 'object',
        properties: {
          name: {
            type: 'object',
            properties: {
              length: {
                type: 'number'
              }
            }
          }
        }
      })
      const generated = getGeneratedTypes()
      expect(Object.keys(generated).length).toEqual(2)
      expect(generated[typeName]).toEqual(`export type ${typeName} = {name?:ApiType1}`)
    })
    it('Should allow user type', () => {
      const typeName1 = schemaToType({
        type: 'object',
        properties: {
          name: {
            type: 'string'
          }
        }
      })
      const typeName2 = schemaToType({
        type: 'object',
        properties: {
          counter: {
            type: typeName1
          }
        }
      })
      const generated = getGeneratedTypes()
      expect(Object.keys(generated).length).toEqual(2)
      expect(generated[typeName2].trim()).toContain(
        `export type ${typeName2} = {counter?:${typeName1}}`
      )
    })
    it('Should return array of types', () => {
      const typeName = schemaToType({
        type: 'array',
        items: {
          type: 'string'
        }
      })
      expect(typeName).toEqual('string[]')
    })
  })
  describe('Test getTypescriptTypeRow', () => {
    it('Should render right row', () => {
      const res = getTypescriptTypeRow('text', {
        type: 'string'
      })
      expect(res).toEqual('text?:string')
      const res2 = getTypescriptTypeRow('text', {
        type: 'string',
        required: true
      })
      expect(res2).toEqual('text:string')
    })
  })
  describe('Test create uniq name when type already exists', () => {
    it('Should create other type name', () => {
      const typeName = schemaToType({
        title: 'Pet',
        type: 'object',
        properties: {
          name: {
            type: 'string'
          }
        }
      })

      typeName //?

      const typeName2 = generateType(typeName, {
        name: {
          type: 'integer'
        }
      })

      expect(typeName).not.toEqual(typeName2)
    })
    it('Should use same type name', () => {
      const typeName = 'Pet'
      expect(
        generateType(typeName, {
          name: {
            type: 'integer'
          }
        })
      ).toEqual(
        generateType(typeName, {
          name: {
            type: 'integer'
          }
        })
      )
    })
  })
})
