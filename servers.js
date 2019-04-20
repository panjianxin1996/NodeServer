
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
                // console.log('requst---------------------------' + pathname)
                // 如果没找到相关的文件或者文件夹 停止并且报404
                if (!fs.existsSync(data.dirName + pathname)) {
                    process.send({trigger: 'start', info: {status: '12', msg: 'notDir'}})
                    return
                }
                // console.log(data.dirName + pathname)
                // 如果不是文件夹 使用设置请求头来让浏览器打开文件，如果无法打开变成下载
                if (!fs.statSync(data.dirName + pathname).isDirectory()) {
                    fs.readFile(data.dirName + pathname, (err, data) => {
                        if (err) process.send({trigger: 'start', info: {status: '13', msg: err}}) //console.log(err)
                        let urlArr = pathname.split('/')
                        let fileName = urlArr[urlArr.length -1]
                        // console.log(extrName[extrName.length - 1])
                        res.writeHead(200, { 'Content-Type': mime.getType(fileName)})
                        res.end(data)
                    });   
                } else {
                    // 如果打开的是文件夹 则获取模板页面渲染文件夹列表
                    if (!fs.existsSync(data.dirName + pathname)) {
                        // console.log(data.dirName + pathname)
                        process.send({trigger: 'start', info: {status: '12', msg: 'notDir'}})
                        return
                    }
                    fs.readdir(data.dirName + pathname, (err, dat) => {
                        dirData = ''
                        let fileData = ''
                        // dirImgBuf = fs.readFileSync('./src/img/dir.png').toString('base64')
                        // fileImgBuf = fs.readFileSync('./src/img/file.png').toString('base64')
                        dat.forEach(element => {
                            if (fs.statSync(data.dirName + pathname + '/' + element).isDirectory()) {
                                    dirData += `<li onclick="jump('${data.dirName}/${element}','${element}')" title='${data.dirName}/${element}'  class='list_item'>
                                    <p>${element}</p>
                                    <p>文件夹</p>
                                    <p>---</p>
                                    <p>${new Date(fs.statSync(data.dirName + pathname + '/' + element).mtimeMs).toLocaleString()}</p>
                                    </li>`
                            } else {
                                fileData += `<li onclick="jump('${data.dirName}/${element}','${element}')" title='${data.dirName}/${element}'  class='list_item'>
                                <p>${element}</p>
                                <p>文件</p>
                                <p>${parseInt((fs.statSync(data.dirName + pathname + '/' + element).size) / 1024)}KB</p>
                                <p>${new Date(fs.statSync(data.dirName + pathname + '/' + element).mtimeMs).toLocaleString()}</p>
                                </li>`
                            }
                            
                        })
                        // 内容渲染模板
                        let innerHtmlData = `<section>
                        <h1>indexOf${pathname}</h1>
                        <ul class='list_box'>
                            <li class='list_item'>
                                <span onclick='back()'>&lt;返回上一层</span>    
                            </li> 
                            <li class='list_title'>
                                <p>名称</p>
                                <p>类型</p>
                                <p>大小</p>
                                <p>修改日期</p>
                            </li>
                            ${dirData}
                            ${fileData}
                        </ul>
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
            } else {
                // 请求图标logo
                fs.readFile('./public/favicon.ico', (err, data) => {
                    if (err) process.send({trigger: 'start', info: {status: '13', msg: err}}) //console.log(err)
                    let urlArr = pathname.split('/')
                    let fileName = urlArr[urlArr.length -1]
                    // console.log(extrName[extrName.length - 1])
                    res.writeHead(200, { 'Content-Type': mime.getType(fileName)})
                    res.end(data)
                });
            }
        })     
        server.listen(data.port, (ip, port) => {
            console.log('start server in ' + data.port)
            process.send({trigger: 'start', pid: process.pid, info: {status: '10', msg: 'startSuccess'}})
            // event.sender.send('start', {processId: process.pid})
        })
    }
})

