// @flow
/* eslint-disable promise/always-return */
/* eslint-disable no-unused-vars */
import {describe, it, before, after, beforeEach, afterEach} from 'mocha';
import assert from 'assert';

import db from 'sqlite';
import NoteRepository from '../../repositories/NoteRepository';
import os from 'os';
import path from 'path';
import sqlite3 from 'sqlite3';
import fs from 'fs';

let tmpDbPath;

describe('NoteRepository', () => {
    before(() => {
        tmpDbPath = path.join(os.tmpdir(), 'test.db');
        return db.open(tmpDbPath, {
            mode: sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
            verbose: true,
        }).then(() => {
            return NoteRepository.init();
        });
    });

    it('#init creates a db file', () => {
        const stats = fs.statSync(tmpDbPath);
        assert.ok(stats.isFile());
    });

    it('#insert_, #select_, #update_, #delete_, #deleteLogically_, #selectAll_, #selectAllNotDeleted_', () => {
        const title1 = 'THIS IS TITLE';
        const content1 = 'THIS IS CONTENT `内容`';
        const title2 = '$¥\\';
        const content2 = 'あいうえお\nかきくけこ\n\t"HOGE"';
        let id1, id2;
        return NoteRepository.insert_(title1, content1).then(stmt => {
            id1 = stmt.lastID;
            return NoteRepository.select_(id1);
        }).then(row => {
            console.log(row);
            assert.strictEqual(row.title, title1);
            assert.strictEqual(row.content, content1);
            assert.strictEqual(row.deleted, 0);
        }).then(() => {
            return NoteRepository.insert_('', '');
        }).then(stmt => {
            id2 = stmt.lastID;
            return NoteRepository.select_(id2);
        }).then(row => {
            console.log(row);
            assert.strictEqual(row.title, '');
            assert.strictEqual(row.content, '');
            assert.strictEqual(row.deleted, 0);
        }).then(() => {
            return NoteRepository.update_(id2, title2, content2);
        }).then(stmt => {
            assert.equal(stmt.lastID, id2);
            return NoteRepository.deleteLogically_(id1);
        }).then(() => {
            return NoteRepository.selectAll_();
        }).then(rows => {
            // selectAll_() ignores the deleted flag
            console.log(rows);
            assert.strictEqual(rows.length, 2);
            assert.strictEqual(rows[0].title, title1);
            assert.strictEqual(rows[0].content, content1);
            assert.strictEqual(rows[0].deleted, 1);
            assert.strictEqual(rows[1].title, title2);
            assert.strictEqual(rows[1].content, content2);
            assert.strictEqual(rows[1].deleted, 0);
            return NoteRepository.selectAllNotDeleted_();
        }).then(rows => {
            console.log(rows);
            assert.strictEqual(rows.length, 1);
            assert.strictEqual(rows[0].title, title2);
            assert.strictEqual(rows[0].content, content2);
            assert.strictEqual(rows[0].deleted, 0);
            return NoteRepository.select_(id1);
        }).then(row => {
            // select_() ignores the deleted flag
            assert.strictEqual(row.title, title1);
            assert.strictEqual(row.content, content1);
            assert.strictEqual(row.deleted, 1);
            return NoteRepository.delete_(id1);
        }).then(() => {
            return NoteRepository.select_(id1);
        }).then(row => {
            assert.strictEqual(row, undefined);
        });
    });

    after(() => {
        return db.close().then(() => {
            fs.unlink(tmpDbPath, (err) => {
                if (err) throw err;
                console.log('successfully deleted test db');
            });
        });
    });
});
