// @flow
import * as React from 'react';
import {ipcRenderer} from 'electron';
import MenuItem from 'material-ui/MenuItem';
import Drawer from 'material-ui/Drawer';
import TextField from 'material-ui/TextField';
import * as Immutable from 'immutable';

import IconButton from 'material-ui/IconButton';
import ContentClear from 'material-ui/svg-icons/content/clear';
import AvSortByAlpha from 'material-ui/svg-icons/av/sort-by-alpha';
import {grey500, blue900} from 'material-ui/styles/colors';

import {AppStyles} from '../constants/AppConstants';


import type {NoteId, SavedNote} from '../types/AppTypes';

type Props = {
    onSelectNote: (NoteId) => void,
}

type NoteSortType = 'updated' | 'alpha';

type State = {
    notes: Immutable.List<SavedNote>,
    filterInputValue: string,
    sortType: NoteSortType,
};

export default class NoteViewer extends React.PureComponent {
    props: Props;
    state: State;

    constructor() {
        super();
        this.state = {
            notes: Immutable.List(),
            filterInputValue: '',
            sortType: 'updated',
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
        let notes = this.state.notes.filter(note => this.applyFilter(note));
        const alphaSort: boolean = this.state.sortType === 'alpha';
        if (alphaSort) {
            notes = notes.sort((a, b) => a.title.localeCompare(b.title));
        } else {
            notes = notes.sortBy(note => note.dtUpdated).reverse();
        }
        const listItems = notes.map(note => {
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
        const buttonSize: number = 24;
        const buttonIconSize: number = 18;
        const buttonMarginRight: number = 6;

        return (
            <Drawer
                width={drawerWidth}
                open={true}
                docked={true}
            >
                <div>
                    <TextField
                        name="noteFilterInput"
                        style={Object.assign({}, {
                            margin: '0 8px',
                            width: drawerWidth - 16 - buttonSize*2 - buttonMarginRight,
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
                        iconStyle={{width: buttonIconSize, height: buttonIconSize}}
                        style={{
                            width: buttonSize,
                            height: buttonSize,
                            padding: (buttonSize - buttonIconSize) / 2,
                            marginRight: 0,
                            verticalAlign: 'middle'
                        }}
                    >
                        <ContentClear />
                    </IconButton>
                    <IconButton
                        onTouchTap={() => {
                            this.setState({sortType: alphaSort ? 'updated' : 'alpha'});
                        }}
                        iconStyle={{
                            width: buttonIconSize,
                            height: buttonIconSize,
                            color: alphaSort ? blue900 : grey500,
                        }}
                        style={{
                            width: buttonSize,
                            height: buttonSize,
                            padding: (buttonSize - buttonIconSize) / 2,
                            marginRight: buttonMarginRight,
                            verticalAlign: 'middle',
                        }}
                    >
                        <AvSortByAlpha />
                    </IconButton>

                </div>
                <div className="note-list">
                    {listItems}
                </div>
            </Drawer>
        );
    }
}
