import fs from "fs";
import { parentPort, workerData } from "worker_threads";
import { FileInfoTree, GetFileInfoWorkerData } from "../type";
import { getFileInfo } from "../utils/handle_file_utils.js";

parentPort?.postMessage(_getFilesInfo(workerData));

function _getFilesInfo (workerData: GetFileInfoWorkerData) {
    const currentTree: FileInfoTree = {};

    for (const file of workerData.files) {
        const mtime = fs.statSync(file).mtimeMs;
        /**
         * 1. if has been scan latest
         *    i. if has the same mtime ，don't need scan again, use the value in cache
         *    ii. if has different mtime, scan again
         * 
         * 2. if don't has scan record, scan again
         */
        if (workerData.fileModifyDetail[file] &&
            workerData.fileModifyDetail[file] === mtime &&
            workerData.tree[file]) {
            currentTree[file] = workerData.tree[file];
            continue;
        }

        const fileInfo = getFileInfo(file, workerData.options);
        currentTree[file] = fileInfo;

        workerData.fileModifyDetail[file] = mtime;
    }

    return {
        tree: currentTree,
        fileModifyDetail: workerData.fileModifyDetail,
    };
}