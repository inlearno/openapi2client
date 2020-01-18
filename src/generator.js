import format from 'prettier-eslint'
import path from 'path'
import fs from 'fs'
import { generateActionFileCode, combinePaths } from './generators/actions'
import { handleRootSchemas, cleanGeneratedTypes, getGeneratedTypes } from './generators/types'

let outputDir

export const formatCode = content => {
  return format({
    text: content,
    filePath: __dirname + '/file.ts'
  })
}

const saveFile = (file, content) => {
  return fs.writeFileSync(path.join(outputDir, file), formatCode(content))
}

export const getOutputDir = output => {
  return path.isAbsolute(output) ? output : path.join(process.cwd(), output)
}

export const init = options => {
  cleanGeneratedTypes()
  outputDir = getOutputDir(options.output)
  const actionsDir = path.join(outputDir, 'actions')

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir)
  }
  if (!fs.existsSync(actionsDir)) {
    fs.mkdirSync(actionsDir)
  }
}

export const saveTypes = () => {
  const types = Object.values(getGeneratedTypes())

  if (types.length > 0) {
    return saveFile('types.ts', types.join('\n\n'))
  }
}

export default (scheme, opts) => {
  init(opts)
  if (scheme.components && scheme.components.schemas) {
    handleRootSchemas(scheme.components.schemas)
  }
  if (scheme.paths) {
    const pathsGroups = combinePaths(scheme.paths)
    Object.entries(pathsGroups).map(([tag, group]) => {
      const content = generateActionFileCode(tag, group)
      saveFile(`actions/${tag}.ts`, content)
    })
  }

  saveTypes()
}
