import React, { Component } from 'react';
import './App.css';
import { updateLabel } from 'typescript';
let ipcRenderer = window.require('electron').ipcRenderer;

class App extends Component {
  constructor () {
    super()
    this.state = {
      port: 3030,
      serverStatus: 0,
      dirName: 'F:/360Downloads',
      tips: '',
      serverMsgList: []
    }
  }
  render() {
    let msgDom = this.state.serverMsgList.map((item, index) => (<li key={index}>{item}</li>))
    return (
      <div className="App">
        <header className="App-header">
          <p>
            Edit <code>src/App.js</code> and save to reload.
          </p>
          <input type="text" value={this.state.dirName} onChange={this.changeDirName}/>
          <p>{this.state.dirName}</p>
          <p className='server_status' style={{backgroundColor: this.state.serverStatus === 0 ? 'gray' :  this.state.serverStatus === 1 ? 'green' : 'red'}}></p>
          <button onClick={this.startServer}>start</button>
          <button onClick={this.stopServer}>stop</button>
          <button onClick={this.stopServer}>stop2</button>
          <ul className='console_box'>
            {msgDom}
          </ul>
        </header>
      </div>
    )
  }
  componentDidMount () {
    // 监听主进程返回的消息
    ipcRenderer.on('start', (event, msg) => {
      // this.setState({tips: JSON.stringify(ipcRenderer)})
      // alert(JSON.stringify(msg))
      console.log(msg)
      if (msg === 'hasOneStart') {
        this.setLog(`有一个服务运行中。。。`)
        return
      }
      if (msg) {
        this.setState({serverStatus: 1})
        this.setLog(new Date().toLocaleString() + '......启动服务成功，端口为' + this.state.port)
      } else {
        this.setState({serverStatus: -1})
      }
    })
    ipcRenderer.on('stop', (event, msg) => {
      console.log(msg)
      if (msg === 'notServer') {
        this.setLog(`没有服务运行中。。。`)
        return
      }
      if (msg === 1) {
        this.setState({serverStatus: 0})
        this.setLog(`${new Date().toLocaleString()}......停止端口为${this.state.port}服务`)
        return
      } else {
        this.setState({serverStatus: 1})
        return
      }
    })
  }
  changeDirName = (e) => {
    this.setState({
      dirName: e.target.value
    })
  }
  setLog (msg) {
    let SMList = this.state.serverMsgList
    console.log(SMList)
    SMList.push(msg)
    this.setState({serverMsgList: SMList})
  }
  startServer = () => {
    ipcRenderer.send('start', {port: this.state.port, dirName: this.state.dirName})
    
  }
  stopServer = () => {
    ipcRenderer.send('stop')
  }
}

export default App;
