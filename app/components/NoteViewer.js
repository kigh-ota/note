// @flow
import * as React from 'react';
import {ipcRenderer} from 'electron';
import MenuItem from 'material-ui/MenuItem';
import Drawer from 'material-ui/Drawer';
import TextField from 'material-ui/TextField';
import * as Immutable from 'immutable';

import {AppStyles} from '../constants/AppConstants';

import type {NoteId, SavedNote} from '../types/AppTypes';

type Props = {
    onSelectNote: (NoteId) => void,
}

type State = {
    notes: Immutable.List<SavedNote>,
    filterInputValue: string,
};

export default class NoteViewer extends React.PureComponent {
    props: Props;
    state: State;

    constructor() {
        super();
        this.state = {
            notes: Immutable.List(),
            filterInputValue: '',
        };

        ipcRenderer.on('REFRESH_NOTES', (event: Object, notes: Array<SavedNote>) => {
            this.setState({notes: Immutable.List(notes)});
        });

        ipcRenderer.send('FETCH_NOTES');
    }

    render() {
        // console.log(this.state.notes);
        const listItems = this.state.notes.sortBy(note => note.dtUpdated).reverse().map(note => {
            if (!note.hasOwnProperty('id')) {
                throw new Error('no id in note');
            }
            return (
                <MenuItem
                    key={note.id}
                    style={{
                        minHeight: (AppStyles.textBase.fontSize + 8) + 'px',
                        lineHeight: (AppStyles.textBase.fontSize + 8) + 'px',
                    }}
                    innerDivStyle={AppStyles.textBase}
                    primaryText={`${note.title}`}
                    onTouchTap={this.props.onSelectNote.bind(this, note.id)}
                />
            );
        });

        const drawerWidth: number = 250;

        return (
            <Drawer
                width={drawerWidth}
                open={true}
                docked={true}
            >
                <TextField
                    name="noteFilterInput"
                    style={Object.assign({}, {
                        margin: '0 8px',
                        width: drawerWidth - 16,
                    }, AppStyles.textBase)}
                    hintText="Filter"
                    value={this.state.filterInputValue}
                    onChange={(e: Object, newValue: string) => {
                        this.setState({
                            filterInputValue: newValue,
                        });
                    }}
                />
                {listItems}
            </Drawer>
        );
    }
}
