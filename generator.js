const format = require("prettier-eslint");
const path = require("path");
const fs = require('fs');

const TYPES = {
    string: 'string',
    integer: 'number'
}

const saveFileAndLint = (path, content) => {
    content = format({
        text: content,
        filePath: __dirname + '/file.ts'
    })
    fs.writeFileSync(path, content)
}

const generateTypes = (schemas) => {
    return Object.values(schemas).map(model => {
        if (!model.title) {
            console.warn('Model with empty title, skip', model)
            return
        }
        const props = Object.entries(model.properties).map(([name, opts]) => {
            let type
            if ( TYPES[opts.type] ) {
                type = TYPES[opts.type]
            } else {
                console.error(`[${model.title}.${name}] ERROR: Not found type: ${opts.type}`)
            }

            if (opts.enum) {
                type = opts.enum.map(k => `'${k}'`).join(' | ')
            }

            if (type) {
                return `${name}:${type};`
            }
        }).join("\n")
        return `export type ${model.title}Model = {${props}}`
    }).join("\n\n")
}

module.exports = (scheme, flags) => {
    const outputDir = path.isAbsolute(flags.output) ? flags.output : path.join(process.cwd(), flags.output)
        
    if (!fs.existsSync(outputDir)){
        fs.mkdirSync(outputDir);
    }
    if ( scheme.components && scheme.components.schemas ) {
        saveFileAndLint(
            path.join(outputDir, 'types.ts'),
            generateTypes(scheme.components.schemas)
        )
    }
}