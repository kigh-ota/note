// @flow

import {OrderedSet} from 'immutable';

import type {Set} from 'immutable';
import type {Tag} from '../types/AppTypes';

export default class NoteUtil {
    static parseTags(content: string): Set<Tag> {
        return OrderedSet(
            content.split('\n').filter(line => {
                return line.match(/^#\S+$/);
            }).map(line => {
                return line.substring(1);
            }).filter(tag => {
                return !tag.includes('#');
            })
        );
    }
}
