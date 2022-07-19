import path from 'path';
import fs from 'fs';
import { diff } from './utils/function_change/index.js';
import { confirmFolderExist, getAllFiles, getFuncTree } from './utils/handle_file_utils.js';
import { getImpacts } from './impact.js';
import { CONFIG_FILENAME, IGNORE_DIRS, REPORT_FILE } from './const.js';
import { lookFileOrFolderUp } from './utils/handle_config.js';
import { FileInfoTree, FuncTreeParam, ImpactReason } from './type.js';

export async function coderfly (srcPath: string, monorepo=false) {
    confirmFolderExist();

    let tree: FileInfoTree = {};
    if (!monorepo) {
        tree = await getSingleTree(srcPath);
    } else {
        tree = await getMonorepoTree(srcPath);
    }

    const functionDiffInfo = diff();

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

async function getSingleTree (srcPath: string) {
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

    const files = getAllFiles(path.resolve(process.cwd(), srcPath));

    const tree = await getFuncTree([{
        srcPath,
        files, 
        options: {
            alias
        },
    }]);

    return tree;
}

async function getMonorepoTree (srcPath: string) {
    const rootDir = path.resolve(process.cwd(), srcPath);
    const subPackages = fs.readdirSync(rootDir);

    const treeParams: FuncTreeParam[] = [];

    for (const subPackage of subPackages) {
        if (IGNORE_DIRS.includes(subPackage)) continue;

        const subPackagePath = path.resolve(srcPath, subPackage);
        const configFile = path.resolve(subPackagePath, CONFIG_FILENAME);
        let alias = {};

        if (fs.existsSync(configFile)) {
            try {
                alias = require(configFile);
            } catch (error) {
                console.log(`get configure failed.File path ${path.resolve(srcPath, subPackage)}`);
            }
        }

        const files = getAllFiles(subPackagePath);

        treeParams.push({
            srcPath: subPackagePath,
            files,
            options: {
                alias
            },
        });
    }

    const tree = await getFuncTree(treeParams);

    return tree;
}

