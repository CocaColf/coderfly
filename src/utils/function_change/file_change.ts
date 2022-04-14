import { execaCommandSync } from 'execa';
import { FileChange } from '../../type';

const COMMAND = 'git diff --name-status';

const formatList = (str: string, type: string) => {
    const arr = str.split('\n').filter(item => {
        const regex = new RegExp(`[${type}].*`)
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
    
    const changeInfo = execaCommandSync(COMMAND).stdout;

    typeList.forEach(type => {
        result[type] = formatList(changeInfo, type)  
    })

    return result;
}