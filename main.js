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


ipc.on('start', (event, data) => {
    if (master) {
        event.sender.send('start', 'hasOneStart')
        return
    }
    master = childProcess.fork(__dirname + '/servers.js')
    master.send(data)
    master.on('message', function(msg) {
        event.sender.send('start', msg)
    })
})

ipc.on('stop', (event, msg) => {
    if (!master) {
        event.sender.send('stop', 'notServer')
        return
    }
    master.send('serverStop')
    master.on('message', function(info) {
        event.sender.send('stop', 1)
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