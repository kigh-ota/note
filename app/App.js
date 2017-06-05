// @flow

import * as React from 'react';
import NoteEditor from './components/NoteEditor';
import lightBaseTheme from 'material-ui/styles/baseThemes/lightBaseTheme';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import NoteViewer from './components/NoteViewer';

export default class App extends React.Component {
    render() {
        return (
            <MuiThemeProvider muiTheme={getMuiTheme(lightBaseTheme)}>
                <div>
                    <NoteEditor/>
                    <NoteViewer/>
                </div>
            </MuiThemeProvider>
        );
    }
}
