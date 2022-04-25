import path from 'path';
import fs from 'fs';
import { NameAndPath } from '../type';

export function lookFileOrFolderUp (target: string, baseDir: string) {
    const cwd = process.cwd();
    let oldPath = '';
    let newPath;

    if (baseDir) {
        if (path.isAbsolute(baseDir)) {
            newPath = baseDir;
        } else {
            newPath = path.resolve(cwd, baseDir);
        }
    } else {
        newPath = cwd;
    }

    while (oldPath !== newPath) {
        oldPath = newPath;
        const files = fs.readdirSync(newPath);
        for (const file of files) {
            if (file === target) {
                return newPath;
            }
        }
        newPath = path.dirname(oldPath);
    }
    return '';
}

export function parseAliasFromConfig (config: NameAndPath) {
    Object.keys(config).forEach(alias => {
        config[alias] = path.resolve(process.cwd(), config[alias]);
    });

    return config;
}
