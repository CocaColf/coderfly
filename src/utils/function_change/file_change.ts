import { commandSync } from 'execa';
import { FileChange } from '../../type';

const COMMANDS = ['git diff --name-status', 'git diff --name-status --staged'];

const formatList = (str: string, type: string) => {
    const arr = str.split('\n').filter(item => {
        const regex = new RegExp(`[${type}].*`);
        if (regex.test(item)) {
          return item !== undefined;
        }
    });

    // format
    return arr.map(item => {
      return item.replace(/\s/g, '').replace(type, '');
    });
};

export function getFileChange () {
    const result: FileChange = {};

    const typeList = ['M', 'D', 'A'];
    
    for (const command of COMMANDS) {
      const changeInfo = commandSync(command).stdout;

      typeList.forEach(type => {
        const formatResult = formatList(changeInfo, type);
            if (result[type]) {
                result[type].push(...formatResult);
            } else {
                result[type] = formatResult;
            } 
      });
    }

    return result;
}