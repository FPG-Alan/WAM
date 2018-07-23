import React, { Component } from 'react';
import { TitleBar } from 'react-desktop/macOs';
import { observable } from 'mobx'
import { observer } from 'mobx-react'
import './App.css';

@observer
class App extends Component {
  @observable isFullscreen = false
  render() {
    return (
      <div className="App">
        {/* <TitleBar
          title="test"
          controls
          isFullscreen={this.isFullscreen}
          onCloseClick={() => console.log('Close window')}
          onMinimizeClick={() => console.log('Minimize window')}
          onMaximizeClick={() => console.log('Mazimize window')}
          onResizeClick={() => this.isFullscreen = !this.isFullscreen}
        /> */}
      </div>
    );
  }
}

export default App;
