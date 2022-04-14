/**
 * whether there is a loop call and return the basic path
 * ['a','b','c','d','a','b','c','d','a']
 * [['a', 'a.js'], ['b', 'b.js'], ['c', 'c.js'], ['a', 'a.js']] => [['a', 'a.js'], ['b', 'b.js'], ['c', 'c.js']]
 */
function handleCircularPath (paths: string[][]): [boolean, string[][]] {
    const mapping = new Map();
    
    for (let i = 0; i < paths.length; i++) {
        const name = paths[i][0];
        const path = paths[i][1];

        if (mapping.has(name) && path === mapping.get(name)) {
            return [true, Array.from(mapping)];
        } else {
            mapping.set(name, path);
        }
    }

    return [false, paths];
}

export {
    handleCircularPath,
}