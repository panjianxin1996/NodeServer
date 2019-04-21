import React, { Component } from 'react';
import './App.css';
// import { updateLabel } from 'typescript';
let ipcRenderer = window.require('electron').ipcRenderer;

class App extends Component {
  constructor () {
    super()
    this.state = {
      port: 3030,
      serverStatus: 0,
      dirName: '',
      tips: '',
      serverMsgList: []
    }
  }
  render() {
    let msgDom = this.state.serverMsgList.map((item, index) => (<li key={index}  dangerouslySetInnerHTML={{ __html: item}}></li>))
    return (
      <div className="App">
        <header className="App-header">
          <p className='title_Name'>
            NodeJS Server Provided By PanJianxin<sup className='title_subbar'>NSPBP</sup>
          </p>
          <input type="text" value={this.state.dirName} onChange={this.changeDirName}/>
          <div className='tips'>我们将启动服务与<b>3030</b>端口上，并且以你以上指定的路径问服务器根路径。</div>
          <p>{this.state.dirName}</p>
          <div className='flex_row status_box'>
            <p>server status:</p>
            <p className='server_status' style={{backgroundColor: this.state.serverStatus === 0 ? 'gray' :  this.state.serverStatus === 1 ? 'green' : 'red'}}></p>
          </div>
          <div className='button_box'>
            <button className='click_button' onClick={this.startServer}>server start</button>
            <button className='click_button' onClick={this.stopServer}>server stop</button>
          </div>
          <ul className='console_box'>
            {msgDom}
          </ul>
        </header>
      </div>
    )
  }
  componentDidMount () {
    // Monitor main process callback message
    ipcRenderer.on('main_start', (event, msg) => {
      if (msg === 'hasOneStart') {
        this.setLog(`<span class='infoTips'>有一个服务运行中。。。</span>`)
        return
      }
      if (msg) {
        this.setState({serverStatus: 1})
        this.setLog(`${new Date().toLocaleString()}----启动服务成功，端口为<b>${this.state.port}</b>`)
      } else {
        this.setState({serverStatus: -1})
      }
    })
    ipcRenderer.on('main_stop', (event, msg) => {
      if (msg === 'notServer') {
        this.setLog(`<span class='infoTips'>没有服务运行中。。。</span>`)
        return
      }
      if (msg === 1) {
        this.setState({serverStatus: 0})
        this.setLog(`${new Date().toLocaleString()}----停止端口为<b>${this.state.port}</b>服务`)
        return
      } else {
        this.setState({serverStatus: 1})
        return
      }
    })
    ipcRenderer.on('error_print', (event, msg) => {
      this.setLog(`<span class='errTips'>${new Date().toLocaleString()}_抛出错误----${this.statusDelWith(msg.status, msg.msg)}</span>`)
    })
    ipcRenderer.on('console_print', (event, msg) => {
      this.setLog(`<span class='commonTips'>${new Date().toLocaleString()}_请求----${msg.msg}</span>`)
    })
  }
  changeDirName = (e) => {
    let tmpVal = e.target.value.replace("\\","\/")
    this.setState({
      dirName: tmpVal
    })
  }
  setLog (msg) {
    let SMList = this.state.serverMsgList
    SMList.push(msg)
    this.setState({serverMsgList: SMList})
  }
  statusDelWith (code, msg) {
    let tmpMsg = ''
    switch (code) {
      case '00':
        tmpMsg = '文件夹地址不存在！'
      break
      case '01':
        tmpMsg = '没有对应的文件夹路径,你必须指定文件夹路径！'
      break
      case '12':
        tmpMsg = '没找到相关的文件或者文件夹！'
      break
      case '13':
        tmpMsg = JSON.stringify(msg)
      break
      default:
        tmpMsg = code+'码无法识别'
      break
    }
    return tmpMsg
  }
  startServer = () => { // send server start event
    ipcRenderer.send('start', {port: this.state.port, dirName: this.state.dirName})
  }
  stopServer = () => {  // send server stop event
    ipcRenderer.send('stop')
  }
}

export default App;
