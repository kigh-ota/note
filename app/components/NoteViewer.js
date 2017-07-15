// @flow
import * as React from 'react';
import {ipcRenderer} from 'electron';
import MenuItem from 'material-ui/MenuItem';
import Drawer from 'material-ui/Drawer';
import TextField from 'material-ui/TextField';
import * as Immutable from 'immutable';

import IconButton from 'material-ui/IconButton';
import ContentClear from 'material-ui/svg-icons/content/clear';


import {AppStyles} from '../constants/AppConstants';

import type {NoteId, SavedNote, Tag} from '../types/AppTypes';
import NoteUtil from '../utils/NoteUtil';
import {OrderedSet} from '../../node_modules/immutable/dist/immutable';

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

    applyFilter(note: SavedNote): boolean {
        if (this.state.filterInputValue === '') {
            return true;    // no filter
        }
        return (note.title.toLocaleLowerCase().indexOf(this.state.filterInputValue.toLocaleLowerCase()) !== -1); // filter by title (case-insensitive)
    }

    render() {
        // console.log(this.state.notes);
        const listItems = this.state.notes
            .filter(note => this.applyFilter(note))
            .sortBy(note => note.dtUpdated)
            .reverse()
            .map(note => {
                if (!note.hasOwnProperty('id')) {
                    throw new Error('no id in note');
                }
                return (
                    <MenuItem
                        key={note.id}
                        className="note-list-item"
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
        const clearButtonSize: number = 24;
        const clearButtonIconSize: number = 18;
        const clearButtonMarginRight: number = 6;

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
                        width: drawerWidth - 16 - clearButtonSize - clearButtonMarginRight,
                    }, AppStyles.textBase)}
                    hintText="Filter"
                    value={this.state.filterInputValue}
                    onChange={(e: Object, newValue: string) => {
                        this.setState({
                            filterInputValue: newValue,
                        });
                    }}
                />
                <IconButton
                    disabled={this.state.filterInputValue === ''}
                    onTouchTap={() => {this.setState({filterInputValue: ''});}}
                    iconStyle={{width: clearButtonIconSize, height: clearButtonIconSize}}
                    style={{
                        width: clearButtonSize,
                        height: clearButtonSize,
                        padding: (clearButtonSize - clearButtonIconSize) / 2,
                        marginRight: clearButtonMarginRight,
                    }}
                >
                    <ContentClear />
                </IconButton>
                <div className="note-list">
                    {listItems}
                </div>
            </Drawer>
        );
    }
}
