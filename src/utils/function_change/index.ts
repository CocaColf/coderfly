import { DiffInfo } from "../../type";
import { isAllowExt } from "../handle_file_utils.js";
import { getFunctionDiffInfo } from "./diff.js";
import { getFileChange } from "./file_change.js";

// get function changes from file changes
export function diff () {
    const result: DiffInfo[] = [];
    const changedList = getFileChange();

    Object.keys(changedList).forEach(changeType => {
        const files = changedList[changeType];

        for (const file of files) {
            if (!isAllowExt(file)) continue;

            result.push({
                file,
                ...getFunctionDiffInfo(file)
            });
        }
    });

    return result;
}