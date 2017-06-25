// @flow
import {app, BrowserWindow, ipcMain} from 'electron';
import path from 'path';
import url from 'url';
import AppUtil from './utils/AppUtil';
import {AppModes} from './constants/AppConstants';
import type {AppModeType, Note, NoteId} from './types/AppTypes';
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
    return NoteRepository.selectAllNotDeleted_().then(rows => {
        event.sender.send('REFRESH_NOTES', rows);
        return true;
    }).catch(() => {
        return false;
    });
}

function fetchNotes(event: Object): Promise<boolean> {
    return sendNotesToRenderer_(event);
}

function saveNote(event: Object, note: Note): Promise<boolean> {
    let promise: Promise<boolean>;
    promise = note.id
        ? NoteRepository.update_(note.id, note.title, note.content)
        : NoteRepository.insert_(note.title, note.content);
    promise = promise.then(stmt => {
        if (note.id) {
            console.log(`Note updated: id=${note.id}`);
            event.sender.send('SAVE_NOTE_REPLY', note.id);
        } else {
            console.log(`Note added: id=${stmt.lastID}`);
            event.sender.send('SAVE_NOTE_REPLY', stmt.lastID);
        }
        return sendNotesToRenderer_(event);
    }).catch(() => {
        console.log('Failed to save a note');
        return false;
    });
    return promise;
}

function getNote(event: Object, id: NoteId): Promise<boolean> {
    return NoteRepository.select_(id).then(row => {
        event.sender.send('GET_NOTE_REPLY', row);
        return true;
    }).catch(() => {
        console.log(`Failed to get a note (id=${id})`);
        return false;
    });
}

function deleteNote(event: Object, id: NoteId): Promise<boolean> {
    return NoteRepository.deleteLogically_(id).then(() => {
        return sendNotesToRenderer_(event);
    }).catch(() => {
        console.log(`Failed to delete the note (id=${id})`);
        return false;
    });
}

app.on('ready', () => {
    const DbFileName = {
        DEVELOPMENT: path.join(app.getPath('documents'), 'note.db'),
        PRODUCTION: path.join(app.getPath('documents'), 'note.db'),
        TEST: ':memory:',
    };
    return db.open(DbFileName[appMode], {
        mode: sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
        verbose: true,
    }).then(() => {
        return Promise.all([NoteRepository.init()]);
    }).then(() => {

        ipcMain.on('SAVE_NOTE', saveNote);
        ipcMain.on('FETCH_NOTES', fetchNotes);
        ipcMain.on('GET_NOTE', getNote);
        ipcMain.on('DELETE_NOTE', deleteNote);

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
