// @flow

import * as React from 'react';
import NoteEditor from './components/NoteEditor';
import lightBaseTheme from 'material-ui/styles/baseThemes/lightBaseTheme';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import NoteViewer from './components/NoteViewer';
import type {NoteId} from './types/AppTypes';

type State = {
    noteIdInEdit: ?NoteId,  // must always be equal to NoteEditor.state.id
}

export default class App extends React.Component {
    state: State;
    noteEditor: NoteEditor;

    constructor() {
        super();
        this.state = {
            noteIdInEdit: null,
        };
    }

    render() {
        return (
            <MuiThemeProvider muiTheme={getMuiTheme(lightBaseTheme)}>
                <div>
                    <NoteViewer
                        noteIdInEdit={this.state.noteIdInEdit}
                        onSelectNote={(id: NoteId) => {
                            this.setState({noteIdInEdit: id});
                            this.noteEditor.open(id);
                        }}
                    />
                    <NoteEditor
                        ref={node => { this.noteEditor = node; }}
                        onChangeNoteId={(id: ?NoteId) => {
                            this.setState({noteIdInEdit: id});
                        }}
                    />
                </div>
            </MuiThemeProvider>
        );
    }
}
