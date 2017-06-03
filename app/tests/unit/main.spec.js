// @flow
/* eslint-disable promise/always-return */
/* eslint-disable no-unused-vars */
import {describe, it, beforeEach, afterEach} from 'mocha';
import assert from 'assert';

import AppUtil from '../../utils/AppUtil';

describe('#getAppMode', () => {
    it('returns correct modes', () => {
        assert.equal(AppUtil.getAppMode(), 'PRODUCTION');
        process.env['DEVELOPMENT'] = '1';
        assert.equal(AppUtil.getAppMode(), 'DEVELOPMENT');
        process.env['TEST'] = '1';
        assert.equal(AppUtil.getAppMode(), 'TEST');
    });
});