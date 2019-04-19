
let ip, port,server, dirData
let fs = require('fs')
let http = require('http')
let url = require('url')
let mime = require("mime")
process.on('message', function(data) {
    if (data === 'serverStop') {
        process.send({trigger: 'stop', pid: process.pid,  info: {status: '10', msg: 'stopSuccess'}}) //杀掉服务器进程
        process.exit()
        // process.on('exit', (code) => {
        //     console.log(`退出码: ${code}`);
        // })
    } else {
        if (!fs.existsSync(data.dirName)) {
            // console.log('not found dir or file')
            process.send({trigger: 'start', info: {status: '00', msg: 'notTrueDir'}})
            process.exit()
            return
        }
        if (!fs.statSync(data.dirName).isDirectory()) {
            // console.log('not dir')
            process.send({trigger: 'start', info: {status: '01', msg: 'notDir'}})
            process.exit()
            return
        }
        server = http.createServer(function(req, res){
            ip = res.socket.localAddress
            port = res.socket.localPort
            var reqUrl = url.parse(req.url, true)
            var pathname = decodeURI(reqUrl.pathname)
            // console.log(decodeURI(pathname))
            // console.log(reqUrl)
            // console.log(reqUrl)
            if (pathname !== '/favicon.ico') {
                process.send({trigger: 'start', info: {status: '11', msg: pathname}})
                console.log('requst---------------------------' + pathname)
                // 如果没找到相关的文件或者文件夹 停止并且报404
                if (!fs.existsSync(data.dirName + pathname)) {
                    process.send({trigger: 'start', info: {status: '12', msg: 'notDir'}})
                    return
                }
                // console.log(data.dirName + pathname)
                if (!fs.statSync(data.dirName + pathname).isDirectory()) {
                    fs.readFile(data.dirName + pathname, (err, data) => {
                        if (err) process.send({trigger: 'start', info: {status: '13', msg: err}}) //console.log(err)
                        let urlArr = pathname.split('/')
                        let fileName = urlArr[urlArr.length -1]
                        let extrName = fileName.split('.')
                        // console.log(extrName[extrName.length - 1])
                        res.writeHead(200, { 'Content-Type': mime.getType(fileName)})
                        res.end(data)
                    });   
                } else {
                    // 如果打开的是文件夹 则获取模板页面渲染文件夹列表
                    if (!fs.existsSync(data.dirName + pathname)) {
                        console.log(data.dirName + pathname)
                        process.send({trigger: 'start', info: {status: '12', msg: 'notDir'}})
                        return
                    }
                    fs.readdir(data.dirName + pathname, (err, dat) => {
                        dirData = ''
                        let fileData = ''
                        dat.forEach(element => {
                            // console.log(data.dirName + pathname+element)
                            if (fs.statSync(data.dirName + pathname+element).isDirectory()) {
                                dirData += `<li onclick="jump('${data.dirName}/${element}','${element}')" title='${data.dirName}/${element}'>
                                <span>${element}</span>
                                <span>文件夹</span>
                                <span>---</span>
                            </li>`
                            } else {
                                fileData += `<li onclick="jump('${data.dirName}/${element}','${element}')" title='${data.dirName}/${element}'>
                                <span>${element}</span>
                                <span>文件</span>
                                <span>${fs.statSync(data.dirName + pathname+element).size}</span>
                            </li>`
                            }
                            
                        })
                        let innerHtmlData = `<section>
                        <h1>${pathname}</h1>
                        <ul>${dirData}${fileData}</ul>
                        </section>`
                        // 请求模板页面渲染
                        fs.readFile('./src/home.html', (err, data) => {
                            if (err) process.send({trigger: 'start', info: {status: '13', msg: err}}) //console.log(err)
                            let htmlTemplate = data.toString()
                            htmlTemplate = htmlTemplate.replace('$$__$$', innerHtmlData)
                            // console.log(htmlTemplate)
                            res.writeHead(200, { 'Content-Type': 'text/html;charset:utf-8' })
                            res.end(htmlTemplate)

                        });
                    })
                }
            }
        })     
        server.listen(data.port, (ip, port) => {
            console.log('start server in ' + data.port)
            process.send({trigger: 'start', pid: process.pid, info: {status: '10', msg: 'startSuccess'}})
            // event.sender.send('start', {processId: process.pid})
        })
    }
})

