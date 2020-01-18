import generator, { formatCode } from '../src/generator'
import { generateType, cleanGeneratedTypes, getGeneratedTypes } from '../src/generators/types'
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
