import { Worker } from 'worker_threads';
import { cpus } from 'os';
import path from 'path';
import fs from 'fs';
import { FileInfoTree, GetTreeOptions } from '../type';
import { FILE_MODIFY_DETAIL, TREE_FILE } from '../const.js';

export function getFileInfoWorker (files: string[], options?: GetTreeOptions): Promise<FileInfoTree> {
    return new Promise((resolve, reject) => {
        let fileModifyDetail = {};

        if (fs.existsSync(FILE_MODIFY_DETAIL)) {
            fileModifyDetail = JSON.parse(fs.readFileSync(FILE_MODIFY_DETAIL, 'utf8'));
        }

        let tree: FileInfoTree = {};
        if (fs.existsSync(TREE_FILE)) {
            tree = JSON.parse(fs.readFileSync(TREE_FILE, 'utf8'));
        }

        const threadCount = cpus().length;
        const threads: Set<Worker> = new Set();
        const everyWorkerFileCount = Math.ceil(files.length / threadCount);

        for (let i = 0; i < threadCount; i++) {
            threads.add(new Worker(path.resolve(__dirname, './get_file_info_thread.js'), {
                workerData: {
                    files: files.splice(0, everyWorkerFileCount),
                    options,
                    fileModifyDetail,
                    tree,
                }
            }));
        }

        for (const worker of threads) {
            worker.on('error', (err) => {
                reject(new Error(`worker stopped with ${err}`));
            });

            worker.on('exit', (code) => {
                threads.delete(worker);
                // console.log(`Thread exiting, ${threads.size} running...`)

                if (code !== 0) {
                    reject(new Error(`stopped with  ${code} exit code`))
                }

                if (threads.size === 0) {
                    fs.writeFileSync(FILE_MODIFY_DETAIL, JSON.stringify(fileModifyDetail, null, 4));
                    resolve(tree);
                }
            })
    
            worker.on('message', (msg) => {
                Object.assign(tree, msg.tree);
                Object.assign(fileModifyDetail, msg.fileModifyDetail);
            });
        }
    });
}