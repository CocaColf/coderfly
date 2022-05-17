import { commandSync } from "execa";
import fs from 'fs';
import path from "path";
import { MATCHED_VUE } from "./const.js";
import { lookFileOrFolderUp } from "./utils/handle_config.js";
import { confirmFolderExist } from "./utils/handle_file_utils.js";

export function matchVueVersion () {
    confirmFolderExist();

    if (fs.existsSync(MATCHED_VUE)) {
        return;
    }

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

    fs.writeFileSync(MATCHED_VUE, 'true');
}