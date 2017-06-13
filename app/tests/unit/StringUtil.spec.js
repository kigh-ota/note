// @flow
/* eslint-disable promise/always-return */
/* eslint-disable no-unused-vars */
import {describe, it, before, after, beforeEach, afterEach} from 'mocha';
import assert from 'assert';
import StringUtil from '../../utils/StringUtil';

describe('StringUtil', () => {
    describe('#getLineInfo', () => {
        const str = 'L1\n  * 2行目\n\t\n\tline 4';

        it('empty string', () => {
            assert.deepStrictEqual(StringUtil.getLineInfo(0, ''), {
                str: '',
                posBegin: 0,
                posEnd: 0,
                col: 0,
                num: 1,
                indent: 0,
                bullet: '',
            });
            assert.throws(() => {
                StringUtil.getLineInfo(1, '');
            });
        });

        it('properties', () => {
            assert.deepStrictEqual(StringUtil.getLineInfo(3, str), {
                str: '  * 2行目',
                posBegin: 3,
                posEnd: 10,
                col: 0,
                num: 2,
                indent: 2,
                bullet: '* ',
            });
        });

        it('does not parse a tab as an indent', () => {
            assert.deepStrictEqual(StringUtil.getLineInfo(11, str), {
                str: '\t',
                posBegin: 11,
                posEnd: 12,
                col: 0,
                num: 3,
                indent: 0,
                bullet: '',
            });
        });
    });

    describe('#decreaseIndent', () => {
        const str = 'A\n B\n  C\n   D\n    E\n';
        it('0 -> 0', () => {
            assert.deepStrictEqual(StringUtil.decreaseIndent(str, 0), {
                updated: 'A\n B\n  C\n   D\n    E\n',
                numRemove: 0,
            });
        });
        it('1 -> 0', () => {
            assert.deepStrictEqual(StringUtil.decreaseIndent(str, 2), {
                updated: 'A\nB\n  C\n   D\n    E\n',
                numRemove: 1,
            });
        });
        it('2 -> 0', () => {
            assert.deepStrictEqual(StringUtil.decreaseIndent(str, 5), {
                updated: 'A\n B\nC\n   D\n    E\n',
                numRemove: 2,
            });
        });
        it('2 -> 0, line-end', () => {
            assert.deepStrictEqual(StringUtil.decreaseIndent(str, 8), {
                updated: 'A\n B\nC\n   D\n    E\n',
                numRemove: 2,
            });
        });
        it('3 -> 2', () => {
            assert.deepStrictEqual(StringUtil.decreaseIndent(str, 9), {
                updated: 'A\n B\n  C\n  D\n    E\n',
                numRemove: 1,
            });
        });
        it('4 -> 2', () => {
            assert.deepStrictEqual(StringUtil.decreaseIndent(str, 14), {
                updated: 'A\n B\n  C\n   D\n  E\n',
                numRemove: 2,
            });
        });
    });

    describe('#increaseIndent', () => {
        const str = 'A\n B\n  C\n   D\n    E\n';
        it('0 -> 2', () => {
            assert.deepStrictEqual(StringUtil.increaseIndent(str, 0), {
                updated: '  A\n B\n  C\n   D\n    E\n',
                numAdd: 2,
            });
        });
        it('1 -> 2', () => {
            assert.deepStrictEqual(StringUtil.increaseIndent(str, 2), {
                updated: 'A\n  B\n  C\n   D\n    E\n',
                numAdd: 1,
            });
        });
        it('2 -> 4', () => {
            assert.deepStrictEqual(StringUtil.increaseIndent(str, 5), {
                updated: 'A\n B\n    C\n   D\n    E\n',
                numAdd: 2,
            });
        });
        it('2 -> 4, line-end', () => {
            assert.deepStrictEqual(StringUtil.increaseIndent(str, 8), {
                updated: 'A\n B\n    C\n   D\n    E\n',
                numAdd: 2,
            });
        });
    });
});
