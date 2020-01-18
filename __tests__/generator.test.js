import generator, { formatCode } from '../src/generator'
import { generateType, cleanGeneratedTypes, getGeneratedTypes } from '../src/generators/types'
import { combinePaths } from '../src/generators/actions'
import fs from 'fs'
const schema = require('./fixtures/schema.json')

afterEach(() => {
  cleanGeneratedTypes()
})

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
    generateType('PetModel', schema.components.schemas.Pet.properties)
    const generatedTypes = getGeneratedTypes()
    const res = formatCode(generatedTypes.PetModel)
    expect(res).toEqual('export type PetModel = { id?: number; name?: string }\n')
  })
})

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
