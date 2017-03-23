/**
 * Modules
 * Node
 * @constant
 */
'use strict';


const fs = require('fs-extra');
const json2md = require('json2md');
const os = require('os');
const path = require('path');

/**
 * Modules
 * External
 * @constant
 */
const _ = require('lodash');
const appRootPath = require('app-root-path')['path'];

/**
 * Modules
 * Internal
 * @constant
 */
const logger = require(path.join(appRootPath, 'lib', 'logger'))({ timestamp: false });
const packageJson = require(path.join(appRootPath, 'package.json'));


/**
 * Filesystem
 * @constant
 * @default
 */
const filename = 'RELEASENOTES';
const filetitle = 'Release Notes';
const inputFilepath = path.join(appRootPath, `${filename}.json`);
const outputFilepath = path.join(appRootPath, `${filename}.md`);


/**
 * Release Notes Template
 * @constant
 * @default
 */
const releasenotesTemplate = {
    'features': [],
    'bugfixes': [],
    'documentation': [],
    'internals': []
};


/**
 * Transform Release Notes Object to markdown
 * @param {Object} releasenotesObject - Release Notes object
 * @returns {Array} - Markdown lines
 */
let transformToMarkdown = (releasenotesObject) => {
    logger.debug('transformToMarkdown');

    let markdownList = [];

    Object.keys(releasenotesObject).forEach((value) => {
        markdownList.push(json2md({ h4: _.startCase(value) }));

        let entryContent = { ul: [] };
        releasenotesObject[value].forEach((entryNote) => { entryContent.ul.push(entryNote); });

        markdownList.push(json2md(entryContent));
        //markdownList.push(os.EOL);
    });

    return markdownList;
};

/**
 * Write release notes to disk
 *
 * @public
 */
let updateFile = () => {
    logger.debug('writeReleasenotes');

    let releasenotesVersionsList = [];
    let releasenotesVersionsObject = {};
    let releasenotesVersionsText;

    // Read from RELEASENOTES.json
    try {
        releasenotesVersionsObject = JSON.parse(fs.readFileSync(inputFilepath).toString());
    } catch (err) {
        logger.error(`release notes file read error:`, inputFilepath);
        return;
    }

    // Parse RELEASENOTES.json
    Object.keys(releasenotesVersionsObject).forEach((value) => {
        releasenotesVersionsList.push(json2md({ h2: value }));
        releasenotesVersionsList = releasenotesVersionsList.concat(transformToMarkdown(releasenotesVersionsObject[value]));
    });

    releasenotesVersionsList.unshift(json2md({ h1: filetitle }));
    releasenotesVersionsText = releasenotesVersionsList.join(os.EOL);

    //logger.debug('writeReleasenotes', releasenotesVersionsText);

    // Write to RELEASENOTES.md
    fs.writeFileSync(outputFilepath, releasenotesVersionsText);

    logger.info('release notes updated:', outputFilepath);
};

/**
 * Get latest Release Notes
 * @returns {String} - Release notes text
 *
 * @public
 */
let getLatest = () => {
    logger.debug('getReleasenotes');

    let releasenotesList = [];
    let releasenotesVersionsObject = {};
    let releasenotesText;

    // Read from CHANGELOG.json
    try {
        releasenotesVersionsObject = JSON.parse(fs.readFileSync(inputFilepath).toString());
    } catch (err) {
        logger.error(`release notes file read error:`, inputFilepath);
    }

    if (releasenotesVersionsObject.hasOwnProperty(packageJson.version)) {
        releasenotesList = transformToMarkdown(releasenotesVersionsObject[packageJson.version]);
        logger.info('release notes found for:', `v${packageJson.version}`);
    } else {
        releasenotesList = transformToMarkdown(releasenotesTemplate);
        logger.warn('release notes missing for:', `v${packageJson.version}`);
    }

    releasenotesText = json2md(releasenotesList);

    return releasenotesText;
};


/**
 * Main
 */
if (require.main === module) {
    updateFile();
}


/**
 * @exports
 */
module.exports = {
    getLatest: getLatest,
    update: updateFile
};
