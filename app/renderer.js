// @flow
import * as React from 'react';
import {render} from 'react-dom';
import App from './App';

import 'reset-css/reset.css';
import './index.css';

import injectTapEventPlugin from 'react-tap-event-plugin';

injectTapEventPlugin();

render(
    <App/>,
    document.getElementById('app')
);