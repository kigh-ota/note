// @flow
import {app, BrowserWindow, ipcMain} from 'electron';
import path from 'path';
import url from 'url';
import AppUtil from './utils/AppUtil';
import {AppModes, DbFileName} from './constants/AppConstants';
import type {AppModeType, Note} from './types/AppTypes';
import db from 'sqlite';
import sqlite3 from 'sqlite3';
import NoteRepository from './repositories/NoteRepository';

const appMode: AppModeType = AppUtil.getAppMode();
let mainWindow: ?BrowserWindow;

function createWindow(): void {
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

function sendNotesToRenderer_(event: Object): Promise<boolean> {
    return NoteRepository.selectAll_().then(rows => {
        event.sender.send('REFRESH_NOTES', rows);
        return true;
    }).catch(() => {
        return false;
    });
}

function addNote(event: Object, note: Note): Promise<boolean> {
    return NoteRepository.insert_(note.title, note.content).then(id => {
        console.log(`Note added as id=${id}`);
        return sendNotesToRenderer_(event);
    }).catch(() => {
        console.log('Failed to add note');
        return false;
    });
}

function fetchNotes(event: Object): Promise<boolean> {
    return sendNotesToRenderer_(event);
}

// TODO add cache for notes

app.on('ready', () => {
    return db.open(
        path.join(app.getPath('documents'), DbFileName[appMode]),
        {
            mode: sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
            verbose: true,
        }
    ).then(() => {
        return Promise.all([NoteRepository.init()]);
    }).then(() => {

        ipcMain.on('ADD_NOTE', addNote);
        ipcMain.on('FETCH_NOTES', fetchNotes);

        createWindow();
        return Promise.resolve();
    });
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
    db.close();
});
