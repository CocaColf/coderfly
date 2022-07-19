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
export const FILE_MODIFY_DETAIL = path.resolve(CODERFLY_FOLDER, 'file_modify_detail.json');

export const IGNORE_DIRS = [
    'logs', 
    'pids', 
    'lib-cov', 
    'coverage', 
    'bower_components', 
    'node_modules',
    'jspm_packages',
    'web_modules',
    'dist',
    '.rpt2_cache',
    '.rts2_cache_cjs',
    '.rts2_cache_es',
    '.rts2_cache_umd',
    '.cache',
    '.parcel-cache',
    '.vuepress',
    '.serverless',
    '.fusebox',
    '.dynamodb',
    '.yarn',
];
