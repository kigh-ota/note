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

    it('#insert_, #select_, #update_, #delete_, #selectAll_', () => {
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
            assert.equal(row.title, title1);
            assert.equal(row.content, content1);
        }).then(() => {
            return NoteRepository.insert_('', '');
        }).then(stmt => {
            id2 = stmt.lastID;
            return NoteRepository.select_(id2);
        }).then(row => {
            console.log(row);
            assert.equal(row.title, '');
            assert.equal(row.content, '');
        }).then(() => {
            return NoteRepository.update_(id2, title2, content2);
        }).then(stmt => {
            assert.equal(stmt.lastID, id2);
            return NoteRepository.delete_(id1);
        }).then(() => {
            return NoteRepository.selectAll_();
        }).then(rows => {
            assert.equal(rows.length, 1);
            assert.equal(rows[0].title, title2);
            assert.equal(rows[0].content, content2);
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
