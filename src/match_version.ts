import { commandSync } from "execa";
import path from "path";
import { lookFileOrFolderUp } from "./utils/handle_config.js";

export function matchVueVersion () {
    let vueVersion = 'latest';
    let vueTemplateCompilerVersion = '';

    try {
        vueVersion = require('vue').version;
        const vtcDir = require.resolve('vue-template-compiler');
        if (vtcDir) {
            vueTemplateCompilerVersion = require(`${path.dirname(vtcDir)}/package.json`).version;
        }
    } catch (e) {}

    if (vueVersion && vueTemplateCompilerVersion && vueTemplateCompilerVersion === vueVersion) {
        return;
    }

    // use yarn or npm
    const yarnLockDir = lookFileOrFolderUp('yarn.lock', process.cwd());
    if (yarnLockDir) {
        try { commandSync('yarn remove vue-template-compiler') } catch {}
        commandSync(`yarn add vue-template-compiler@${vueVersion}`);
    } else {
        try { commandSync('npm uninstall vue-template-compiler') } catch {}
        commandSync(`npm install vue-template-compiler@${vueVersion}`);
    }
}