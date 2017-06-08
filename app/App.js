// @flow

import * as React from 'react';
import NoteEditor from './components/NoteEditor';
import lightBaseTheme from 'material-ui/styles/baseThemes/lightBaseTheme';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import NoteViewer from './components/NoteViewer';
import type {NoteId} from './types/AppTypes';

export default class App extends React.Component {
    noteEditor: NoteEditor;

    render() {
        return (
            <MuiThemeProvider muiTheme={getMuiTheme(lightBaseTheme)}>
                <div>
                    <NoteViewer
                        onSelectNote={(id: NoteId) => {this.noteEditor.open(id);}}
                    />
                    <NoteEditor
                        ref={node => { this.noteEditor = node; }}
                    />
                </div>
            </MuiThemeProvider>
        );
    }
}
