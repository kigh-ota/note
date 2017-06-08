// @flow
import * as React from 'react';
import {ipcRenderer} from 'electron';
import {List, ListItem} from 'material-ui/List';
import * as Immutable from 'immutable';

import type {NoteId, SavedNote} from '../types/AppTypes';

type Props = {
    onSelectNote: (NoteId) => void,
}

type State = {
    notes: Immutable.List<SavedNote>,
};

export default class NoteViewer extends React.PureComponent {
    props: Props;
    state: State;

    constructor() {
        super();
        this.state = {notes: Immutable.List()};

        ipcRenderer.on('REFRESH_NOTES', (event: Object, notes: Array<SavedNote>) => {
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
                    innerDivStyle={{
                        fontFamily: 'Monaco',
                        fontSize: '13px',
                    }}
                    primaryText={`[${note.id ? note.id.toString() : ''}] ${note.title}`}
                    onTouchTap={this.props.onSelectNote.bind(this, note.id)}
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
