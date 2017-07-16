// @flow
/* eslint-disable promise/always-return */
/* eslint-disable no-unused-vars */
import {describe, it, before, after, beforeEach, afterEach} from 'mocha';
import assert from 'assert';
import EditorUtil from '../../utils/EditorUtil';

describe('EditorUtil', () => {
    describe('#getLineInfo', () => {
        const str = 'L1\n  * 2行目\n\t\n\tline 4';

        it('empty string', () => {
            assert.deepStrictEqual(EditorUtil.getLineInfo(0, ''), {
                str: '',
                posBegin: 0,
                posEnd: 0,
                col: 0,
                num: 1,
                indent: 0,
                bullet: '',
            });
            assert.throws(() => {
                EditorUtil.getLineInfo(1, '');
            });
        });

        it('properties', () => {
            assert.deepStrictEqual(EditorUtil.getLineInfo(3, str), {
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
            assert.deepStrictEqual(EditorUtil.getLineInfo(11, str), {
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
            assert.deepStrictEqual(EditorUtil.decreaseIndent(str, 0), {
                updated: 'A\n B\n  C\n   D\n    E\n',
                numRemove: 0,
            });
        });
        it('1 -> 0', () => {
            assert.deepStrictEqual(EditorUtil.decreaseIndent(str, 2), {
                updated: 'A\nB\n  C\n   D\n    E\n',
                numRemove: 1,
            });
        });
        it('2 -> 0', () => {
            assert.deepStrictEqual(EditorUtil.decreaseIndent(str, 5), {
                updated: 'A\n B\nC\n   D\n    E\n',
                numRemove: 2,
            });
        });
        it('2 -> 0, line-end', () => {
            assert.deepStrictEqual(EditorUtil.decreaseIndent(str, 8), {
                updated: 'A\n B\nC\n   D\n    E\n',
                numRemove: 2,
            });
        });
        it('3 -> 2', () => {
            assert.deepStrictEqual(EditorUtil.decreaseIndent(str, 9), {
                updated: 'A\n B\n  C\n  D\n    E\n',
                numRemove: 1,
            });
        });
        it('4 -> 2', () => {
            assert.deepStrictEqual(EditorUtil.decreaseIndent(str, 14), {
                updated: 'A\n B\n  C\n   D\n  E\n',
                numRemove: 2,
            });
        });
    });

    describe('#increaseIndent', () => {
        const str = 'A\n B\n  C\n   D\n    E\n';
        it('0 -> 2', () => {
            assert.deepStrictEqual(EditorUtil.increaseIndent(str, 0), {
                updated: '  A\n B\n  C\n   D\n    E\n',
                numAdd: 2,
            });
        });
        it('1 -> 2', () => {
            assert.deepStrictEqual(EditorUtil.increaseIndent(str, 2), {
                updated: 'A\n  B\n  C\n   D\n    E\n',
                numAdd: 1,
            });
        });
        it('2 -> 4', () => {
            assert.deepStrictEqual(EditorUtil.increaseIndent(str, 5), {
                updated: 'A\n B\n    C\n   D\n    E\n',
                numAdd: 2,
            });
        });
        it('2 -> 4, line-end', () => {
            assert.deepStrictEqual(EditorUtil.increaseIndent(str, 8), {
                updated: 'A\n B\n    C\n   D\n    E\n',
                numAdd: 2,
            });
        });
    });
});
