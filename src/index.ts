import path from 'path';
import fs from 'fs';
import { diff } from './utils/function_change/index.js';
import { confirmFolderExist, getAllFiles, getFuncTree } from './utils/handle_file_utils.js';
import { getImpacts, findWhoCallMe } from './impact.js';
import { getTemplateInfo } from './utils/parse_template_ast.js';
import { CONFIG_FILENAME, REPORT_FILE } from './const.js';
import { lookFileOrFolderUp } from './utils/handle_config.js';
import { ImpactReason } from './type.js';

async function coderfly (srcPath: string) {
    let alias = {};
    const configFolder = lookFileOrFolderUp(CONFIG_FILENAME, path.resolve(process.cwd(), srcPath));

    if (configFolder) {
        const configFile = path.resolve(configFolder, CONFIG_FILENAME);

        try {
            alias = require(configFile);
        } catch (error){
            // do nothing
        }
    }

    confirmFolderExist();

    const functionDiffInfo = diff();

    const files = getAllFiles(path.resolve(process.cwd(), srcPath));

    const tree = await getFuncTree(files, {
        alias
    });

    const allFunctions: ImpactReason[] = [];
    functionDiffInfo.forEach(item => {
        const file = path.resolve(process.cwd(), item.file);

        item.total.forEach(fn => {
            allFunctions.push({
                filePath: file,
                name: fn,
                paths: [[fn, file]]
            });
        });
    });

    const impactReport: any[] = [];

    allFunctions.forEach(item => {
        const impact = getImpacts(tree, item);
        impactReport.push(impact);
    });

    fs.writeFileSync(REPORT_FILE, JSON.stringify(impactReport, null, 4));
}

export {
    getAllFiles,
    getFuncTree,
    getTemplateInfo,
    getImpacts,
    findWhoCallMe,
    diff,
    coderfly,
};