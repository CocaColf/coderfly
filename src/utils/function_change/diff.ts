import * as fs from 'fs';
import * as path from 'path';
import { commandSync } from 'execa';
import lineByLine from 'n-readlines';
import { visit } from 'recast';
import { parse } from '@babel/parser';
import { parseComponent } from 'vue-template-compiler';
import { DiffFunctionInfo, FunctionInfo } from '../../type';
import { nanoid } from 'nanoid';

// get the change of function before and after file change 
export function getFunctionDiffInfo (filePath: string, commitSha?: string) {
    let functionInfoBefore;
    let functionInfoNow;

    if (!fs.existsSync(filePath)) {  // file deleted
        functionInfoNow = {};
    } else {
        functionInfoNow = getFunctionBlock(filePath);
    }

    const blobId = getFileCtxBeforeChange(filePath, commitSha);
    if (!blobId) {
        // treat it as a new file
        functionInfoBefore = {};
    } else {
        const beforeCtx = commandSync(`git cat-file blob ${blobId}`).stdout;
        const tempFile = `./temp_${path.posix.basename(filePath)}`;
        fs.writeFileSync(tempFile, beforeCtx);
        functionInfoBefore = getFunctionBlock(tempFile);
        fs.unlinkSync(tempFile);
    }

    return diffFunctionInfo(functionInfoNow, functionInfoBefore);
}

function getFileLinesString (filePath: string, start: number, end: number): string {
    const result: string[] = [];

    let lineNumber = 0;
    const liner = new lineByLine(filePath);
    let line = liner.next();

    while (line) {
        if (lineNumber >= start && lineNumber <= end) {
            result.push(line.toString());
        }

        lineNumber++;
        line = liner.next();
    }

    return result.join('').replace(/\s/g, '');
}

// get function and function text content, build a function information object
function getFunctionBlock (filePath: string) {
    const functionInfo: FunctionInfo = {};

    let code = fs.readFileSync(filePath, 'utf-8');
    const extName = path.extname(filePath);

    let ast;
    const tempFile = path.resolve(process.cwd(), `temp_vue_script_${nanoid(10)}.js`);

    if (extName === '.vue') {
        const compilerResult = parseComponent(code);
        code = compilerResult.script ? compilerResult.script.content : '';
        fs.writeFileSync(tempFile, code);
        filePath = tempFile;
    }

    try {
        ast = parse(code, {
            plugins: [
                'decorators-legacy',
                'typescript',
                'classProperties',
                'objectRestSpread',
                'jsx',
            ],
            sourceType: 'unambiguous'
        });
    } catch (error) {
        console.log(error);
        return {};
    }

    visit(ast, {
        /**
         * function test () {}
         */
        visitFunctionDeclaration (node) {
            const functionName = node.value.id.name;

            const blockLineStart = node.value.body.loc.start.line;
            const blockLineEnd = node.value.body.loc.end.line;

            const blockStr = getFileLinesString(filePath, blockLineStart, blockLineEnd);

            functionInfo[functionName] = blockStr;

            return false;
        },
        
        /**
         * const test = () => {}
         */
        visitArrowFunctionExpression (node) {
            let functionName;

            if (node.parentPath.value.type === 'VariableDeclarator') {  // const test = () =>
                functionName = node.parentPath.value.id.name;
            } else if (node.parentPath.value.type === 'ObjectProperty') { // computed: { ROLE: () => {} }
                functionName = node.parentPath.value.key.name;
            }

            const blockLineStart = node.value.body.loc.start.line;
            const blockLineEnd = node.value.body.loc.end.line;

            const blockStr = getFileLinesString(filePath, blockLineStart, blockLineEnd);

            functionInfo[functionName] = blockStr;
    
            return false;
        },

        /**
         * let test = function () {}
         */
        visitFunctionExpression (node) {
            let functionName;

            if (node.parentPath.value.type === 'VariableDeclarator') {  // const test = () =>
                functionName = node.parentPath.value.id.name;
            } else if (node.parentPath.value.type === 'ObjectProperty') { // computed: { ROLE: () => {} }
                functionName = node.parentPath.value.key.name;
            }

            const blockLineStart = node.value.body.loc.start.line;
            const blockLineEnd = node.value.body.loc.end.line;

            const blockStr = getFileLinesString(filePath, blockLineStart, blockLineEnd);

            functionInfo[functionName] = blockStr;


            return false;
        },

        visitClassMethod (node) {
            const functionName = node.value.key.name;

            const blockLineStart = node.value.body.loc.start.line;
            const blockLineEnd = node.value.body.loc.end.line;

            const blockStr = getFileLinesString(filePath, blockLineStart, blockLineEnd);

            functionInfo[functionName] = blockStr;
            
            return false;
        },

        visitObjectMethod(node) {
            const functionName = node.value.key.name;

            const blockLineStart = node.value.body.loc.start.line;
            const blockLineEnd = node.value.body.loc.end.line;

            const blockStr = getFileLinesString(filePath, blockLineStart, blockLineEnd);

            functionInfo[functionName] = blockStr;
            
            return false;
        }
    });

    if (extName === '.vue') {
        fs.unlinkSync(tempFile);
    }

    return functionInfo;
}

/**
 * diff function change from 「function information object」before and after file change
 * 
 *  1. if the function name is the same && the text is the same => function not change
 *  2. if the function name is the same && the text is not the same => function modified
 *   3. if the function existed before && does not existed now => function deleted
 *  4. if the function does not existed before && existed now => function added
 */
function diffFunctionInfo (infoNow: FunctionInfo, infoBefore: FunctionInfo): DiffFunctionInfo {
    const functionListNow = Object.keys(infoNow);
    const functionListBefore = Object.keys(infoBefore);

    const commonFns = functionListNow.filter(item => functionListBefore.includes(item));

    const added = functionListNow.filter(item => !functionListBefore.includes(item));

    const deleted = functionListBefore.filter(item => !functionListNow.includes(item));

    const changed = [];
    for (const fn of commonFns) {
        if (infoNow[fn] !== infoBefore[fn]) {
            changed.push(fn);
        }
    }

    return {
        changed,
        added,
        deleted,
        total: [...changed, ...added, ...deleted],
    };
}

// get file content before change from git blobs
function getFileCtxBeforeChange (filePath: string, commitSha?: string) {
    if (!commitSha) {
        commitSha = latestCommitSha();
    }

    const gitBlobs = commandSync(`git ls-tree -r ${commitSha}`).stdout;
    const blobArr = gitBlobs.split('\n');

    for (const blobItem of blobArr) {
        const metas = blobItem.split(/\s{1,}/g);
        if (metas.length > 1 && metas[3] === filePath) {
            return metas[2];
        }
    }
}

function latestCommitSha () {
    return commandSync('git rev-parse HEAD').stdout;
}