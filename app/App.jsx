// @flow

import * as React from 'react';

type Props = {};
type State = {};

class App extends React.Component {
    props: Props;
    state: State;

    constructor(props: Props) {
        super(props);
        this.state = {};
    }

    render() {
        return (
            <div><h1>Note</h1></div>
        );
    }
}

export default App;
