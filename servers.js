
let ip, port,server, dirData
let fs = require('fs')
let http = require('http')
let url = require('url')
let mime = require("mime")
process.on('message', function(data) {
    if (data === 'serverStop') {
        process.send(process.pid) //杀掉服务器进程
        process.exit()
        // process.on('exit', (code) => {
        //     console.log(`退出码: ${code}`);
        // })
    } else {
        if (!fs.existsSync(data.dirName)) {
            console.log('not found dir or file')
            return
        }
        if (!fs.statSync(data.dirName).isDirectory()) {
            console.log('not dir')
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
                console.log('requst---------------------------' + pathname)
                // 如果没找到相关的文件或者文件夹 停止并且报404
                if (!fs.existsSync(data.dirName + pathname)) {
                    console.log('not found dir or file')
                    return
                }
                if (!fs.statSync(data.dirName + pathname).isDirectory()) {
                    fs.readFile(data.dirName + pathname, (err, data) => {
                        if (err) console.log(err)
                        let urlArr = pathname.split('/')
                        let fileName = urlArr[urlArr.length -1]
                        let extrName = fileName.split('.')
                        console.log(extrName[extrName.length - 1])
                        // switch (extrName[extrName.length - 1]) {

                        // }
                        res.writeHead(200, { 'Content-Type': mime.getType(fileName)})
                        res.end(data)
                    });   
                } else {
                    // 如果打开的是文件夹 则获取模板页面渲染文件夹列表
                    fs.readdir(data.dirName + pathname, (err, dat) => {
                        dirData = ''
                        dat.forEach(element => {
                            dirData += `<p onclick="jump('${data.dirName}/${element}','${element}')" title='${data.dirName}/${element}'>${element}</p>`
                        })
                        fs.readFile('./src/home.html', (err, data) => {
                            if (err) console.log(err)
                            let htmlTemplate = data.toString()
                            htmlTemplate = htmlTemplate.replace('$$__$$', dirData)
                            // console.log(htmlTemplate)
                            res.writeHead(200, { 'Content-Type': 'text/html;charset:utf-8' })
                            res.end(htmlTemplate)

                        });
                    })
                }
            }
            // req.on('data', function(dat) {      // 接收客户端发送过来的数据， 也就是 xmlHttp.send(value);
            //     console.log(dat)
            // });
            // fs.readdir(data.dirName, (err, dat) => {
            //     // console.log(dat)
            //     dirData = ''
            //     dat.forEach(element => {
            //         dirData += `<p><a href='#' onclick="jump('${data.dirName}/${element}','${element}')" title='${data.dirName}/${element}'>${element}</a></p>`
            //     })
            //     fs.readFile('./src/home.html', (err, data) => {
            //         if (err) console.log(err)
            //         let htmlTemplate = data.toString()
            //         htmlTemplate = htmlTemplate.replace('$$__$$', dirData)
            //         // console.log(htmlTemplate)
            //         res.writeHead(200, { 'Content-Type': 'text/html;charset:utf-8' })
            //         res.end(htmlTemplate)
            //     });
            // })
        })
        
        server.listen(data.port, (ip, port) => {
            console.log('start server in ' + data.port)
            process.send(process.pid)
            // event.sender.send('start', {processId: process.pid})
        })
    }

    
})

