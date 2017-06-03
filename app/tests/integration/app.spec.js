// @flow
/* eslint-disable promise/always-return */
/* eslint-disable no-unused-vars */
import {Application} from 'spectron';
import electron from 'electron';
import fs from 'fs';
import path from 'path';
import assert from 'assert';
import {describe, it, beforeEach, afterEach} from 'mocha';
import {AppModes, DbFileName} from '../../constants/AppConstants';

function getDocumentPath(app): Promise<string> {
    return app.electron.remote.app.getPath('documents');
}

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
        return getDocumentPath(this.app).then(docPath => {
            fs.unlink(path.join(docPath, DbFileName.TEST), (err) => {
                if (err) throw err;
                console.log('successfully deleted test db');
            });
        }).then(() => {
            if (this.app && this.app.isRunning()) {
                return this.app.stop();
            }
        });
    });

    it('shows an initial window', () => {
        return this.app.client.getWindowCount().then(count => {
            assert.equal(count, 1);
        });
    });

    it('creates test db', () => {
        return getDocumentPath(this.app).then(docPath => {
            const stats = fs.statSync(path.join(docPath, DbFileName.TEST));
            assert.ok(stats.isFile());
        });
    });
});
