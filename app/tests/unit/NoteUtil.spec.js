// @flow
/* eslint-disable promise/always-return */
/* eslint-disable no-unused-vars */
import {describe, it, before, after, beforeEach, afterEach} from 'mocha';
import assert from 'assert';
import NoteUtil from '../../utils/NoteUtil';

describe('#parseTags', () => {
    it('parses', () => {
        const tagArray = NoteUtil.parseTags(`
#1
hoge
# a
#タグ
#1
#a#
#タグ2
`).toArray();
        assert.deepStrictEqual(tagArray, ['1', 'タグ', 'タグ2']);
    });
});