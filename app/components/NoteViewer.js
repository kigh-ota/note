// @flow
import * as React from 'react';
import {ipcRenderer} from 'electron';
import {List, ListItem} from 'material-ui/List';
import * as Immutable from 'immutable';

import type {Note} from '../types/AppTypes';

type State = {
    notes: Immutable.List<Note>,
};

export default class NoteViewer extends React.PureComponent {
    state: State;

    constructor() {
        super();
        this.state = {notes: Immutable.List()};

        ipcRenderer.on('REFRESH_NOTES', (event: Object, notes: Array<Note>) => {
            this.setState({notes: Immutable.List(notes)});
        });

        ipcRenderer.send('FETCH_NOTES');
    }

    render() {
        console.log(this.state.notes);
        const listItems = this.state.notes.sortBy(note => note.dtUpdated).reverse().map(note => {
            if (!note.hasOwnProperty('id')) {
                throw new Error('no id in note');
            }
            return (
                <ListItem
                    key={note.id}
                    primaryText={`[${note.id ? note.id.toString() : ''}] ${note.title}`}
                />
            );
        });

        return (
            <List>
                {listItems}
            </List>
        );
    }
}
