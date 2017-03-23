'use strict';


/**
 * Modules
 * Node
 * @constant
 */
const fs = require('fs-extra');
const path = require('path');
const util = require('util');

/**
 * Modules
 * Electron
 * @constant
 */
const electron = require('electron');
const { remote } = electron;
const app = electron.app ? electron.app : remote.app;
const BrowserWindow = electron.BrowserWindow ? electron.BrowserWindow : remote.BrowserWindow;

/**
 * Modules
 * External
 * @constant
 */
const _ = require('lodash');
const appRootPath = require('app-root-path')['path'];
const Appdirectory = require('appdirectory');
const AutoLaunch = require('auto-launch');
const electronSettings = require('electron-settings');

/**
 * Modules
 * Internal
 * @constant
 */
const logger = require(path.join(appRootPath, 'lib', 'logger'))({ write: true });
const packageJson = require(path.join(appRootPath, 'package.json'));
const platformHelper = require(path.join(appRootPath, 'lib', 'platform-helper'));
const messengerService = require(path.join(appRootPath, 'app', 'scripts', 'main', 'services', 'messenger-service'));

/**
 * Application
 * @constant
 * @default
 */
const appName = packageJson.name;
const appVersion = packageJson.version;

/**
 * Modules
 * Configuration
 */
let autoLauncher = new AutoLaunch({ name: appName, mac: { useLaunchAgent: true } });

/**
 * Filesystem
 * @constant
 * @default
 */
const appLogDirectory = (new Appdirectory(appName)).userLogs();
const appSoundDirectory = path.join(appRootPath, 'sounds').replace('app.asar', 'app.asar.unpacked');

/**
 * @constant
 * @default
 */
const defaultInterval = 1000;


/**
 * Get Main Window
 * @returns {Electron.BrowserWindow}
 * @function
 */
let getPrimaryWindow = () => {
    logger.debug('getPrimaryWindow');

    return BrowserWindow.getAllWindows()[0];
};

/**
 * Show app in menubar or taskbar only
 * @param {Boolean} showInTrayOnly - True: show dock icon, false: hide icon
 * @function
 */
let setShowInTrayOnly = (showInTrayOnly) => {
    logger.debug('setShowInTrayOnly', showInTrayOnly);

    let interval = setInterval(() => {
        const win = getPrimaryWindow();
        if (!win) { return; }

        switch (platformHelper.type) {
            case 'darwin':
                if (showInTrayOnly) {
                    app.dock.hide();
                } else { app.dock.show(); }
                break;
            case 'win32':
                win.setSkipTaskbar(showInTrayOnly);
                break;
            case 'linux':
                win.setSkipTaskbar(showInTrayOnly);
                break;
        }

        clearInterval(interval);
    }, defaultInterval);
};

/**
 * Configuration Items
 * @namespace
 */
let configurationItems = {
    /** @description Application version */
    internalVersion: {
        /** @readonly */
        keypath: 'internalVersion',
        /** @default */
        default: appVersion,

        init() {
            logger.debug(this.keypath, 'init');
        },
        get() {
            logger.debug(this.keypath, 'get');

            return electronSettings.get(this.keypath);
        },
        set(internalVersion) {
            logger.debug(this.keypath, 'set');

            electronSettings.set(this.keypath, internalVersion);
        }
    },
    /** @description Timestamp of last notification */
    lastNotification: {
        /** @readonly */
        keypath: 'lastNotification',
        /** @default */
        default: Math.floor(Date.now() / 1000) - 86400,

        init() {
            logger.debug(this.keypath, 'init');
        },
        get() {
            logger.debug(this.keypath, 'get');

            return electronSettings.get(this.keypath);
        },
        set(lastNotification) {
            logger.debug(this.keypath, 'set');

            electronSettings.set(this.keypath, lastNotification);
        }
    },
    /** @description Launch on system start */
    launchOnStartup: {
        /** @readonly */
        keypath: 'launchOnStartup',
        /** @default */
        default: true,

        init() {
            logger.debug(this.keypath, 'init');

            this.implement(this.get());
        },
        get() {
            logger.debug(this.keypath, 'get');

            return electronSettings.get(this.keypath);
        },
        set(launchOnStartup) {
            logger.debug(this.keypath, 'set', launchOnStartup);

            this.implement(launchOnStartup);
            electronSettings.set(this.keypath, launchOnStartup);
        },
        implement(launchOnStartup) {
            logger.debug(this.keypath, 'implement', launchOnStartup);

            if (launchOnStartup) {
                autoLauncher.enable();
            } else {
                autoLauncher.disable();
            }
        }
    },
    /** @description Logs file path */
    logFile: {
        /** @readonly */
        keypath: 'logFile',
        /** @default */
        default: path.join(appLogDirectory, appName + '.log'),

        init() {
            logger.debug(this.keypath, 'init');
        },
        get() {
            logger.debug(this.keypath, 'get');

            return electronSettings.get(this.keypath);
        },
        set(logFile) {
            logger.debug(this.keypath, 'set');

            electronSettings.set(this.keypath, logFile);
        }
    },
    /** @description Show last notifications on startup */
    replayOnLaunch: {
        /** @readonly */
        keypath: 'replayOnLaunch',
        /** @default */
        default: true,

        init() {
            logger.debug(this.keypath, 'init');
        },
        get() {
            logger.debug(this.keypath, 'get');

            return electronSettings.get(this.keypath);
        },
        set(soundVolume) {
            logger.debug(this.keypath, 'set');

            electronSettings.set(this.keypath, soundVolume);
        }
    },
    /** @description Last updates release notes */
    releaseNotes: {
        /** @readonly */
        keypath: 'releaseNotes',
        /** @default */
        default: '',

        init() {
            logger.debug(this.keypath, 'init');
        },
        get() {
            logger.debug(this.keypath, 'get');

            return electronSettings.get(this.keypath);
        },
        set(releaseNotes) {
            logger.debug(this.keypath, 'set');

            electronSettings.set(this.keypath, releaseNotes);
        }
    },
    /** @description Show app in menubar or taskbar only */
    showInTrayOnly: {
        /** @readonly */
        keypath: 'showInTrayOnly',
        /** @default */
        default: true,

        init() {
            logger.debug(this.keypath, 'init');

            this.implement(this.get());
        },
        get() {
            logger.debug(this.keypath, 'get');

            return electronSettings.get(this.keypath);
        },
        set(showInTrayOnly) {
            logger.debug(this.keypath, 'set');

            this.implement(showInTrayOnly);
            electronSettings.set(this.keypath, showInTrayOnly);
        },
        implement(showInTrayOnly) {
            logger.debug(this.keypath, 'implement', showInTrayOnly);

            setShowInTrayOnly(showInTrayOnly);
        }
    },
    /** @description Notification sound enabled */
    soundEnabled: {
        /** @readonly */
        keypath: 'soundEnabled',
        /** @default */
        default: true,

        init() {
            logger.debug(this.keypath, 'init');
        },
        get() {
            logger.debug(this.keypath, 'get');

            return electronSettings.get(this.keypath);
        },
        set(soundVolume) {
            logger.debug(this.keypath, 'set');

            electronSettings.set(this.keypath, soundVolume);
        }
    },
    /** @description Notification sound file path */
    soundFile: {
        /** @readonly */
        keypath: 'soundFile',
        /** @default */
        default: path.join(appSoundDirectory, 'default.wav'),

        init() {
            logger.debug(this.keypath, 'init');

            if (!fs.existsSync(this.get())) {
                this.set(this.default);
            }
        },
        get() {
            logger.debug(this.keypath, 'get');

            return electronSettings.get(this.keypath);
        },
        set(soundFile) {
            logger.debug(this.keypath, 'set');
            electronSettings.set(this.keypath, soundFile);
        },
        implement() {
            messengerService.openFile('Change Sound', 'audio', appSoundDirectory, (error, soundFile) => {
                logger.debug(this.keypath, 'implement', soundFile);

                if (error) {
                    logger.error(error.message);
                    return;
                }

                this.set(soundFile);
            });
        }
    },
    /** @description Notification sound volume */
    soundVolume: {
        /** @readonly */
        keypath: 'soundVolume',
        /** @default */
        default: 0.5,

        init() {
            logger.debug(this.keypath, 'init');
        },
        get() {
            logger.debug(this.keypath, 'get');

            return electronSettings.get(this.keypath);
        },
        set(soundVolume) {
            logger.debug(this.keypath, 'set');

            electronSettings.set(this.keypath, soundVolume);
        }
    },
    /** @description Main Window position and size */
    windowBounds: {
        /** @readonly */
        keypath: 'windowBounds',
        /** @default */
        default: { x: 100, y: 100, width: 400, height: 550 },

        init() {
            logger.debug(this.keypath, 'init');

            this.implement(this.get());

            /**
             * @listens Electron.App#before-quit
             */
            app.on('before-quit', () => {
                logger.debug('app#before-quit');

                const win = getPrimaryWindow();
                if (!win) { return; }
                const bounds = win.getBounds();
                if (!bounds) { return; }

                this.set(win.getBounds());
            });
        },
        get() {
            logger.debug(this.keypath, 'get');

            return electronSettings.get(this.keypath);
        },
        set(windowBounds) {
            logger.debug(this.keypath, 'set', util.inspect(windowBounds));

            electronSettings.set(this.keypath, windowBounds);
        },
        implement(windowBounds) {
            logger.debug(this.keypath, 'implement', util.inspect(windowBounds));

            let interval = setInterval(() => {
                const win = getPrimaryWindow();
                if (!win) { return; }

                win.setBounds(windowBounds);

                clearInterval(interval);
            }, defaultInterval);
        }
    },
    /** @description Main Window visibility */
    windowVisible: {
        /** @readonly */
        keypath: 'windowVisible',
        /** @default */
        default: true,

        init() {
            logger.debug(this.keypath, 'init');

            // Wait for main window
            let interval = setInterval(() => {
                const win = getPrimaryWindow();
                if (!win) { return; }

                this.implement(this.get());

                /**
                 * @listens Electron.BrowserWindow#show
                 */
                win.on('show', () => {
                    this.set(true);
                });

                /**
                 * @listens Electron.BrowserWindow#hide
                 */
                win.on('hide', () => {
                    this.set(false);
                });

                clearInterval(interval);
            }, defaultInterval);
        },
        get() {
            logger.debug(this.keypath, 'get');

            return electronSettings.get(this.keypath);
        },
        set(windowVisible) {
            logger.debug(this.keypath, 'set', windowVisible);

            electronSettings.set(this.keypath, windowVisible);
        },
        implement(windowVisible) {
            logger.debug(this.keypath, 'implement', windowVisible);

            const win = getPrimaryWindow();
            if (!win) { return; }

            if (windowVisible) { win.show(); }
            else { win.hide(); }
        }
    }
};

/**
 * Access single item
 * @returns {Object|void}
 * @function
 *
 * @public
 */
let getItem = (itemId) => {
    logger.debug('getConfigurationItem', itemId);

    if (configurationItems.hasOwnProperty(itemId)) {
        return configurationItems[itemId];
    }
};

/**
 * Get defaults of all items
 * @returns {Object}
 * @function
 */
let getConfigurationDefaults = () => {
    logger.debug('getConfigurationDefaults');

    let defaults = {};
    for (let item of Object.keys(configurationItems)) {
        defaults[item] = getItem(item).default;
    }

    return defaults;
};

/**
 * Set defaults of all items
 * @returns {Object}
 * @function
 */
let setConfigurationDefaults = (callback) => {
    logger.debug('setConfigurationDefaults');

    const cb = callback || function() {};
    let configuration = electronSettings.getAll();
    let configurationDefaults = getConfigurationDefaults();

    electronSettings.setAll(_.defaultsDeep(configuration, configurationDefaults));

    cb(null);
};

/**
 * Initialize all items – calling their init() method
 * @param {Function=} callback - Callback
 * @function
 */
let initializeItems = (callback) => {
    logger.debug('initConfigurationItems');

    const cb = callback || function() {};
    let configurationItemList = Object.keys(configurationItems);

    configurationItemList.forEach((item, itemIndex) => {
        getItem(item).init();

        // Last item
        if (configurationItemList.length === (itemIndex + 1)) {
            logger.debug('initConfigurationItems', 'complete');
            cb(null);
        }
    });
};

/**
 * Remove unknown items
 * @param {Function=} callback - Callback
 * @function
 */
let removeLegacyItems = (callback) => {
    logger.debug('cleanConfiguration');

    const cb = callback || function() {};
    let savedSettings = electronSettings.getAll();
    let savedSettingsList = Object.keys(savedSettings);

    savedSettingsList.forEach((item, itemIndex) => {
        if (!configurationItems.hasOwnProperty(item)) {
            electronSettings.deleteSync(item);
            logger.debug('cleanConfiguration', 'deleted', item);
        }

        // Last item
        if (savedSettingsList.length === (itemIndex + 1)) {
            logger.debug('cleanConfiguration', 'complete');
            cb(null);
        }
    });
};


/**
 * @listens Electron.App#ready
 */
app.once('ready', () => {
    logger.debug('app#ready');

    // Remove item unknown
    setConfigurationDefaults(() => {
        // Initialize items
        initializeItems(() => {
            // Set Defaults
            removeLegacyItems(() => {
                logger.debug('app#will-finish-launching', 'complete');
            });
        });
    });
});

/**
 * @listens Electron.App#before-quit
 */
app.on('before-quit', () => {
    logger.debug('app#before-quit');

    logger.info('settings', electronSettings.getAll());
    logger.info('file', electronSettings.file());
});

/**
 * @exports
 */
module.exports = {
    getConfigurationItem: getItem,
    getItem: getItem,
    settings: electronSettings
};
