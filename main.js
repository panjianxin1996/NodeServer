// main.js

const { app, BrowserWindow } = require('electron')
const ipc = require('electron').ipcMain
const path = require('path')
const url = require('url')
const childProcess = require('child_process')
let master
let serverInfo = {
    isStart: false,
    
}

// 浏览器引用
let mainWindow;

// 创建浏览器窗口函数
let createWindow = () => {
    // 创建浏览器窗口
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600
    });
    // 加载应用中的index.html文件
    mainWindow.loadURL('http://localhost:3000/')
    // 打包环境
    // mainWindow.loadURL(url.format({
    //     pathname: path.join(__dirname, './build/index.html'),
    //     protocol: 'file:',
    //     slashes: true
    // }))

    // 当window被关闭时，除掉window的引用
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
    mainWindow.openDevTools()
}

// ipc monitor
/* 
    res.info.status code解析
     code                      start                                     end
    | 00 | 以前端传来的文件夹路径启动服务器 发现文件夹路径不存在本电脑中 |       /
    | 01 | 以前端传来的文件夹路径启动服务器 发现文件夹路径不是一个文件夹 |       /
    | 10 | 启动成功                                                |    关闭成功
    | 11 | 启动成功后接受请求返回日志                                |       /
    | 12 | 启动成功后请求的文件或者文件名不存在                       |       /
    | 13 | 启动成功后读取文件失败                                   |       /
*/ 
ipc.on('start', (event, data) => {
    if (master) { // if has master(child process), return can't created and start server
        event.sender.send('main_start', 'hasOneStart')  // through ipcMain send 'hasOneStart'
        return
    }
    master = childProcess.fork(__dirname + '/servers.js') // load and run server js file
    master.send(data) // send frontEnd get back message
    master.on('message', function (res) {
        if (res.trigger === 'start') { // this is a judge that when node 'ipc' monitor on an event is 'start'
            if (res.info.status === '10') {
                event.sender.send('main_start', res.pid)
            } else if (res.info.status === '11') {
                event.sender.send('console_print', res.info)
            } else if (res.info.status === '12') {
                event.sender.send('error_print', res.info)
            } else if (res.info.status === '13') {
                event.sender.send('error_print', res.info)
            } else {
                event.sender.send('error_print', res.info)
                if (res.info.status === '00' || res.info.status === '01') {
                    master = null
                }
            }
        }
    })
})

ipc.on('stop', (event, msg) => {
    if (!master) { // if not has master(child process), return can't stop server
        event.sender.send('main_stop', 'notServer') // through ipcMain send 'notServer'
        return
    }
    master.send('serverStop') // send the child process stop commond
    master.on('message', function (res) { // child process callback
        if (res.trigger === 'stop') {
            if (res.info.status === '10') {
                event.sender.send('main_stop', 1)
            } else {
                event.sender.send('error_print', res.info)
            }
            // console.log('tarigger stop event')
        }
    })
    master = null
})
// 当app准备就绪时候开启窗口
app.on('ready', createWindow);

// 当全部窗口都被关闭之后推出
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});