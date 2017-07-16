// @flow
/* eslint-disable promise/always-return */
/* eslint-disable no-unused-vars */
import {Application} from 'spectron';
import electron from 'electron';
// import fs from 'fs';
// import path from 'path';
import assert from 'assert';
import {describe, it, beforeEach, afterEach} from 'mocha';
import {AppModes/*, DbFileName*/} from '../../constants/AppConstants';

// function getDocumentPath(app): Promise<string> {
//     return app.electron.remote.app.getPath('documents');
// }

describe('application launch', function () {
    this.timeout(10000);

    beforeEach(() => {
        let env = {};
        env[AppModes.TEST] = 1;
        this.app = new Application({
            path: electron,
            args: ['.'],
            env: env,
        });
        return this.app.start();
    });

    afterEach(() => {
        // return getDocumentPath(this.app).then(docPath => {
        //     fs.unlink(path.join(docPath, DbFileName.TEST), (err) => {
        //         if (err) throw err;
        //         console.log('successfully deleted test db');
        //     });
        // }).then(() => {
        if (this.app && this.app.isRunning()) {
            return this.app.stop();
        }
        // });
    });

    it('shows an initial window', () => {
        return this.app.client.getWindowCount().then(count => {
            assert.equal(count, 1);
        });
    });

    // it('creates test db', () => {
    //     return getDocumentPath(this.app).then(docPath => {
    //         const stats = fs.statSync(path.join(docPath, DbFileName.TEST));
    //         assert.ok(stats.isFile());
    //     });
    // });

    it('add a note', () => {
        const client = this.app.client;
        const SELECTOR_NOTE_LIST_ITEM = '.note-list .note-list-item';
        return client.elements(SELECTOR_NOTE_LIST_ITEM).then(result => {
            assert.deepStrictEqual(result.value, []);
            return client
                .click('.note-editor .note-title-input')
                .keys('TEST')
                .getValue('.note-editor .note-title-input input[name=titleInput]');
        }).then(value => {
            assert.equal(value, 'TEST');
            return client
                .keys(['Control', 's', '\uE000'])
                .pause(50)
                .elements(SELECTOR_NOTE_LIST_ITEM);
        }).then(result => {
            assert.equal(result.value.length, 1);
        });
    });
});
