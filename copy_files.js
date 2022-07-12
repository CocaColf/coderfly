const path = require('path');
const fs = require('fs');

const dest = path.resolve(__dirname, 'dist/coderfly_vue_compiler');
const compilerFolder = path.resolve(__dirname, 'src/coderfly_vue_compiler');

function copyCompiler () {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest);
    }

    const files = fs.readdirSync(compilerFolder);

    for (const file of files) {
        if (path.extname(file) !== '.js') continue;
        const ctx = fs.readFileSync(path.join(compilerFolder, file), 'utf8');
        fs.writeFileSync(path.join(dest, file), ctx);
    }
}

copyCompiler();