import path from "path";

export const ALLOW_EXT = ['.vue', '.js', '.ts'];
export const TS_DECLARATION_EXT = '.d.ts';
export const UN_KNOWN = 'unknown';
export const IS_TOP_SCOPE = '[is_top_scope]';

export const MUSTACHE_TAG_REG  = /\{\{((?:.|\n)+?)\}\}/g;

export const TEXT_NODE_TYPES = [2, 3];

export const CODERFLY_FOLDER = path.resolve(process.cwd(), '.coderfly');
export const CONFIG_FILENAME = '.coderflyrc.js';
export const MATCHED_VUE = path.resolve(CODERFLY_FOLDER, 'matched_vue');
export const TREE_FILE = path.resolve(CODERFLY_FOLDER, 'file_tree.json');
export const REPORT_FILE = path.resolve(CODERFLY_FOLDER, 'impact_report.json');
