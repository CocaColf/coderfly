import { DiffInfo } from "../../type";
import { getFunctionDiffInfo } from "./diff.js";
import { getFileChange } from "./file_change.js";

// get function changes from file changes
export function diff () {
    const result: DiffInfo[] = [];
    const changedList = getFileChange();

    Object.keys(changedList).forEach(changeType => {
        const files = changedList[changeType];

        for (const file of files) {
            result.push({
                file,
                ...getFunctionDiffInfo(file)
            });
        }
    });

    return result;
}