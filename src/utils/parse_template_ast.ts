import { ASTElement, ASTElementHandler, ASTNode } from "vue-template-compiler";
import { MUSTACHE_TAG_REG, TEXT_NODE_TYPES } from "../const.js";
import { NameAndPath, TemplateKeyInfo } from "../type";

export function getTemplateInfo (templateAst: ASTElement) {
    if (!templateAst) return [];

    const templateKeyInfo: TemplateKeyInfo[] = [];

    const dfs = (root: ASTNode | null, paths: TemplateKeyInfo[]) => {
        if (!root) return;

        let temp!: TemplateKeyInfo;

        if (root.type === 1) {
            const tag = root.tag;

            // event
            // { click: handleClick }
            const events: NameAndPath[] = [];
            if (root.events) {
                Object.keys(root.events).forEach(eventName => {
                    if (Array.isArray(root.events![eventName])) {
                        (root.events![eventName] as ASTElementHandler[]).forEach(subEventInfo => {
                            const parsedFuncName = getVariableNames((subEventInfo as ASTElementHandler)['value']);
                            for (const item of parsedFuncName) {
                                events.push({
                                    [eventName]: item
                                });
                            }
                        })
                    } else {
                        const parsedFuncName = getVariableNames((root.events![eventName] as ASTElementHandler)['value']);
                        for (const item of parsedFuncName) {
                            events.push({
                                [eventName]: item
                            });
                        }
                    }
                });
            }
            

            // classBinding
            const classBinding = getVariableNames(root.classBinding || '');

            // v-bind
            const vBinds: NameAndPath[] = [];
            (root.attrs || []).forEach(attr => {
                // filter out non-v-bind ones
                // vlue could be: 'customTitle()' or '"customTitle()"'
                try {
                    JSON.parse(attr.value);
                } catch (error) {
                    const parsedAttr = getVariableNames(attr.value);
                    for (const item of parsedAttr) {
                        vBinds.push({
                            [attr.name]: item
                        }); 
                    }  
                }
            });

            // v-if
            const vIf = [];
            if (!root.static) {
                if (root.if) {
                    vIf.push(root.if)
                } else if (root.elseif) {
                    vIf.push(root.elseif)
                }
            }
            
            temp = {
                type: root.type,
                tag,
                vIf,
                events,
                vBinds,
                classBinding,
                children: []
            }; 
        }

        if (TEXT_NODE_TYPES.includes(root.type)) {
            let text = [(root.text || '').trim()];
            if (!root.static) {
                // remove {{}}
                const deleteMustacheTagText = MUSTACHE_TAG_REG.exec(text[0]);
                if (deleteMustacheTagText) {
                    const parsedText = getVariableNames(deleteMustacheTagText[1]);
                    text = parsedText;
                }
            }
            temp = {
                type: root.type,
                text,
                children: []
            }
        }

        paths.push(temp);

        ((root as ASTElement).ifConditions || []).forEach((ifCondition, index) => {
            // the first one in the ifcondition has already been processed in the previous level
            // just need to handle v-else-if
            if (index === 0) return;
            dfs(ifCondition.block, temp['children']);
        });
        

        ((root as ASTElement).children ||
            [] ).forEach(item => {
                dfs(item, temp['children']);
            });
    };

    dfs(templateAst, templateKeyInfo);

    return templateKeyInfo;
}

/**
 * get variable names from template
 * 'test() ? "a" : "test2"' => [ 'test']
 * 'test() ? "a" : test2' => [ 'test', 'test2' ]
 * 'getTitle()' => ['getTitle']
 * 'getTitle' => ['getTitle']
 * 'getTitle("args")' => ['getTitle']
 * 'getTitle("host.detail, host2.detail2")' => ['getTitle']
 * 
 * TODO: the effect of  this implementation is very limited, different prople have different ways of writing
 * eg：
 *  i. '(test ? "a" : test2()) ? "b" : "c"'
 *  ii. <li :class="`host-item x-clearfix x-card-wrap x-card-${host.online}`"></li>
 */
function getVariableNames (strExpression: string) {
    // remove '"xx"' or "'xx'"
    // remove the parentheses, eg: test("args") => test
    const replacedQuote = strExpression.replace(/(\'.+\'|\".+\")|(\(.+\)$)/g, '');

    // remove some non-variable name parts
    const words = replacedQuote.split(/[^a-zA-Z0-9$_-]+/);

    return words.filter(item => /\S/g.test(item));
}
