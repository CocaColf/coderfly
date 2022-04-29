import { TEXT_NODE_TYPES } from './const.js';
import { 
    FileInfoTree, 
    FuncCallSearchResult, 
    NameAndPath, 
    ImpactReason, 
    TemplateImpact, 
    TemplateKeyInfo, 
    TemplateImpactResult 
} from './type';
import { handleCircularPath } from './utils/handle_circular_path.js';

function getImpacts (treeData: FileInfoTree, funcInfo: ImpactReason) {
    let templateImpact = [] as TemplateImpactResult[];

    // function entrance
    const main = {
        name: funcInfo.name,
        file: funcInfo.filePath,
    };

    let callList = [funcInfo] as ImpactReason[];
    const impactReport = [];
    const templateFragmentCache: string[] = [];

    while (callList.length) {
        const curFuncInfo = callList.shift();

        if (!curFuncInfo) {
            continue;
        }

        const { theyCallYou } = findWhoCallMe(treeData, curFuncInfo, templateImpact, templateFragmentCache);
        const [ isCircular, miniPath ] = handleCircularPath(curFuncInfo.paths);

        if (!theyCallYou.length) {  // the end of function call stack
            impactReport.push({
                callPaths: curFuncInfo.paths,
                templateImpact
            });
            templateImpact = [];
        } else if (isCircular) {  // function calls are looped,stop here
            impactReport.push({
                callPaths: miniPath,
                templateImpact,
            });
            callList = [];
            templateImpact = [];
        } else {  // keep finding
            callList.push(...theyCallYou);
        }

    }

    return {
        main,
        impactReport
    };
}

// find a function called by which function 
function findWhoCallMe (treeData: FileInfoTree, funcInfo: ImpactReason, reportInfo=[] as TemplateImpactResult[], templateFragmentCache=[] as string[]) {
    const theyCallYou = [] as FuncCallSearchResult[];

    const curFilePath = funcInfo.filePath;
    const funcName = funcInfo.name;
    const curPaths = funcInfo.paths;

    // because the mixin function is mixed into each file,it wil be found multiple times
    // so we need a set
    const set = new Set();

    for (const fileInfo in treeData) {
        // these found functions are used to find the impact of template
        const templateImpactSearchFunc: NameAndPath = {
            [funcName]: curFilePath
        };

        const allFuncsInfo = treeData[fileInfo].allFuncsInfo;
        const templateKeyInfo = treeData[fileInfo].templateKeyInfo;

        if (!Object.keys(allFuncsInfo).length) continue;

        // find the caller in current file
        Object.values(allFuncsInfo).forEach(func => {
            if (func.calledFnList.includes(funcName) && 
                func.calledFnFrom[funcName].filePath === curFilePath &&
                !set.has(`${func.name}-${func.filePath}`)
            ) {
                set.add(`${func.name}-${func.filePath}`);

                // collect call paths
                const paths = [...curPaths];
                paths.push([func.name, func.filePath, func.position]);

                theyCallYou.push({ 
                    filePath: func.filePath,
                    name: func.name,
                    paths,
                });

                templateImpactSearchFunc[func.name] = func.filePath;
            }

            if (func.name === funcName && func.filePath === curFilePath) {
                templateImpactSearchFunc[funcName] = curFilePath;
            }
        });

        // find if the function in the paths is used in the template
        if (templateKeyInfo && templateKeyInfo.length) {
            const domInfo = getTemplateImpact(templateKeyInfo, templateImpactSearchFunc);
            for (const item of domInfo) {
                const filePath = treeData[fileInfo].file;
                
                // fix bug: template impact report has duplicate dom node(s) sometimes.
                // because: if a -> b, first search: templateImpactSearchFunc contains a, theyCallYou contains b, then find dom node where use b
                // second search: callList has b, so templateImpactSearchFunc contains b, theyCallYou is empty, then also find dom node where use b
                // using a cache to record found domFragments
                const cache = `${filePath}-${item.curPath}-${item.nodeInfo.funcName}`;
                if (templateFragmentCache.includes(cache)) {
                    continue;
                }

                templateFragmentCache.push(cache);

                reportInfo.push({
                    filePath: treeData[fileInfo].file,
                    domInfo
                });
            }
        }

    }

    return {
        theyCallYou,
        reportInfo,
    };

}

function getTemplateImpact (templateKeyInfo: TemplateKeyInfo[], templateImpactSearchFunc: NameAndPath) {
    const res = [] as TemplateImpact[];

    const funcNameArr = Object.keys(templateImpactSearchFunc);

    if (!funcNameArr.length) {
        return res;
    } 

    for (const templateInfo of templateKeyInfo) {
        dfsTemplateInfo(funcNameArr, templateInfo, [], res);
    }

    return res;
}

function dfsTemplateInfo (funcNameArr: string[], templateInfo: TemplateKeyInfo, pathList: string[], collect: TemplateImpact[]) {
    const { tag='[blank]', children, type } = templateInfo;

    if (tag !== '[blank]') {
        pathList.push(tag);
    }
    const curPath = pathList.join('->');

    if (type === 1) {
        const { vIf, events, vBinds, classBinding } = templateInfo;
        
        vIf?.forEach(item => {
            if (funcNameArr.includes(item)) {
                collect.push({
                    curPath,
                    nodeInfo: {
                        type: 'if',
                        tag,
                        funcName: item,
                        meta: 'if',
                    }
                })
            }
        });

        events?.forEach(eventInfo => {
            Object.keys(eventInfo).forEach(eventName => {
                if (funcNameArr.includes(eventInfo[eventName])) {
                    collect.push({
                        curPath,
                        nodeInfo: {
                            type: 'event',
                            tag,
                            funcName: eventInfo[eventName],
                            meta: eventName,
                        }
                    });
                }
            });
        });

        vBinds?.forEach(bindInfo => {
            const bindFunc = Object.values(bindInfo)[0];
            const bindName = Object.keys(bindInfo)[0];

            if (funcNameArr.includes(bindFunc)) {
                collect.push({
                    curPath,
                    nodeInfo: {
                        type: 'bind',
                        tag,
                        funcName: bindFunc,
                        meta: bindName,
                    }
                });
            }
        });

        if (classBinding?.length) {
            for (const item of classBinding) {
                funcNameArr.includes(item) &&
                    collect.push({
                        curPath,
                        nodeInfo: {
                            type: 'classBinding',
                            tag,
                            funcName: item,
                            meta: 'class',
                        }
                    });
            }
        }
    }

    if (TEXT_NODE_TYPES.includes(type)) {
        if (templateInfo.text) {
            for (const item of templateInfo.text) {
                funcNameArr.includes(item) && 
                    collect.push({
                        curPath,
                        nodeInfo: {
                            type: 'text',
                            tag,
                            funcName: item,
                        }
                    });
            }
        }
    }

    children.forEach(info => {
        dfsTemplateInfo(funcNameArr, info, pathList, collect);
    });
}

export {
    getImpacts,
    findWhoCallMe,
};