import React, { Component } from 'react';
import './App.css';
import DrawArea from './DisplayCanvas'

class App extends Component {
  render() {
    return (
      <div className="App">
        <DrawArea/>
      </div>
    );
  }
}

export default App;
