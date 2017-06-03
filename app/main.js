// @flow
import {app, BrowserWindow} from 'electron';
import path from 'path';
import url from 'url';
import AppUtil from './utils/AppUtil';
import {AppModes, DbFileName} from './components/AppConstants';
import type {AppModeType} from './types/AppTypes';
const sqlite3 = require('sqlite3').verbose();

const appMode: AppModeType = AppUtil.getAppMode();
let mainWindow: ?BrowserWindow;
let db: Object;

function createWindow() {
    const width = appMode === AppModes.DEVELOPMENT ? 1200 : 900;
    mainWindow = new BrowserWindow({width: width, height: 700, show: false});
    mainWindow.loadURL(url.format({
        pathname: path.join(app.getAppPath(), 'app', 'index.html'),
        protocol: 'file:',
        slashes: true
    }));
    mainWindow.once('ready-to-show', () => {
        if (!mainWindow) throw new Error();
        mainWindow.show();
    });
    if (appMode === AppModes.DEVELOPMENT) {
        mainWindow.webContents.openDevTools();
    }
    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

app.on('ready', () => {
    db = new sqlite3.Database(
        path.join(app.getPath('documents'), DbFileName[appMode]),
        sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE
    );
    createWindow();
});

app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow();
    }
});

app.on('quit', () => {
    db && db.close();
});
