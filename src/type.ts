import { CompiledResult } from "./coderfly_vue_compiler/index";

/*** diff file 相关 ***/
export interface DiffFileInfo {
    [filePath: string]: number[];
}

export interface FunctionInfo {
    [fnName: string]: string;  // 函数和它的块文本内容
}

export interface FileChange {
    [changeType: string]: string[];  // git 文件变动信息。eg: M:[a.js, b.js]
}

export interface DiffFunctionInfo {
    changed: string[];  // 发生变更的函数
    added: string[];  // 新增的函数
    deleted: string[];  // 被删除的函数
    total: string[];  // 汇总
}
export interface DiffInfo extends DiffFunctionInfo {
    file: string; // 文件路径
}

/*** end diff file ***/

// 文件信息树
export interface FileInfoTree {
    [filePath: string]: FileInfo;
}
export interface GetTreeOptions {
    alias?: NameAndPath;
}

// 单个文件中的信息
export interface FileInfo {
    file: string;  // 文件路径
    allFuncsInfo: AllFuncsInfo;  // 该文件的函数信息
    importPkgs: {
        [packageName: string]: string;  // 依赖包的名称和路径
    };
    mixin: string[];  // mixin 信息
    templateKeyInfo: TemplateKeyInfo[];  // vue 模板信息
}

// 函数调用关系
export interface SingleFunctionInfo {
    name: string;  // 函数名称
    filePath: string;  // 函数所在文件路径
    calledFnList: string[],  // 调用的函数
    calledFnFrom: {
        [fnName: string]: {
            filePath: string;
            position: string;
        }
    };  // 调用的函数和它的路径信息
    position: string;  // 位置
}
export interface AllFuncsInfo {
    [funcName: string]: SingleFunctionInfo;
}

export interface TemplateKeyInfo {
    type: number;
    tag?: string;
    vIf?: string[];
    events?: NameAndPath[];
    vBinds?: NameAndPath[];
    classBinding?: string[];
    text?: string[];
    children: TemplateKeyInfo[];
}

// 影响因子
export interface ImpactReason {
    filePath: string;
    name: string;
    paths: string[][];
}

export interface TemplateImpactResult {
    filePath: string;
    domInfo: TemplateImpact[];
}
export interface TemplateImpact {
    curPath: string;
    nodeInfo: {
        type: string;
        tag: string;
        filePath?: string;
        funcName: string;
        meta?: string;
    }
}

// 调用函数的名称和路径
export interface NameAndPath {
    [fnName: string]: string;
}

export interface FuncCallSearchResult {
    filePath: string;
    name: string;
    paths: string[][];
}

export interface FileAstInfo {
    file: string;  // 路径
    jsAst: any;  // JavaScript ast
    templateAst: CompiledResult<string> | undefined;  // vue template ast
    extName: string;
    vueScriptStartLine: number;  // vue script 开始行数
}

export interface GetFileInfoWorkerData {
    files: string[];
    fileModifyDetail: {
        [filePath: string]: number;
    };
    tree: FileInfoTree;
    options?: GetTreeOptions;
}