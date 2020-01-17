import generator, {
  toTypescriptType,
  combinePaths,
  getTypescriptTypeRow,
  generateType,
  formatCode
} from '../src/generator'
import fs from 'fs'
const schema = require('./fixtures/schema.json')

describe('Test generator', () => {
  it('Should generate', () => {
    jest.spyOn(fs, 'existsSync')
    jest.spyOn(fs, 'mkdirSync')
    jest.spyOn(fs, 'writeFileSync')
    fs.existsSync.mockReturnValue(false)
    fs.mkdirSync.mockReturnValue(true)
    fs.writeFileSync.mockReturnValue(true)

    const tempDir = '__gen__'
    generator(schema, { output: tempDir })
  })
})

describe('Test formatCode', () => {
  it('Should format code', () => {
    const generated = generateType('Pet', schema.components.schemas.Pet)
    const res = formatCode(generated)
    expect(res).toEqual('export type PetModel = { id?: number; name?: string }\n')
  })
})

describe('Test toTypescriptType', () => {
  it('Should return string', () => {
    const res = toTypescriptType({
      type: 'string'
    })
    expect(res).toEqual('string')
  })

  it('Should return number', () => {
    const res = toTypescriptType({
      type: 'number'
    })
    expect(res).toEqual('number')
    const res2 = toTypescriptType({
      type: 'integer'
    })
    expect(res2).toEqual('number')
  })
  it('Should return boolean', () => {
    const res = toTypescriptType({
      type: 'boolean'
    })
    expect(res).toEqual('boolean')
  })
  it('Should throw error', () => {
    expect(() => toTypescriptType({ type: 'undefined' })).toThrowError()
    expect(() => toTypescriptType()).toThrowError()
  })
  it('Should return literals for enum fields', () => {
    const res = toTypescriptType({
      enum: ['text1', 'text2']
    })
    expect(res).toEqual(`'text1' | 'text2'`)
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
  it('Should throw with bad type', () => {
    expect(() => getTypescriptTypeRow('name', {})).toThrow()
  })
})

describe('Test combinePaths', () => {
  it('Should group paths by tag', () => {
    const res = combinePaths(schema.paths)
    expect(Object.keys(res).length).toEqual(3)
    expect(res.one.length).toEqual(2)
    expect(res.two.length).toEqual(1)
    expect(res.default.length).toEqual(1)
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
