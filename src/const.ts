import path from "path";

export const ALLOW_EXT = ['.vue', '.js', '.ts'];
export const UN_KNOWN = 'unknown';
export const IS_TOP_SCOPE = '[is_top_scope]';

export const MUSTACHE_TAG_REG  = /\{\{((?:.|\n)+?)\}\}/g;

export const TEXT_NODE_TYPES = [2, 3];

export const CONFIG_FILENAME = '.coderflyrc.js';
export const TREE_FILE = path.resolve(process.cwd(), './file_tree.json');
export const REPORT_FILE = path.resolve(process.cwd(), './impact_report.json');
