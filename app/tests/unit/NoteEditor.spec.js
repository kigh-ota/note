// @flow
/* eslint-disable promise/always-return */
/* eslint-disable no-unused-vars */
import {describe, it, before, after, beforeEach, afterEach} from 'mocha';
import assert from 'assert';
import NoteEditor from '../../components/NoteEditor';

describe('#toDateString', () => {
    it('returns YYYY-MM-DD', () => {
        assert.equal(NoteEditor.toDateString(new Date(2017, 5, 5)), '2017-06-05');
        assert.equal(NoteEditor.toDateString(new Date(2000, 11, 31)), '2000-12-31');
    });
});
