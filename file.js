/**
 文件处理的函数
 */
const path = require('path')
const fs = require('fs')
const _ = require('lodash')
const sendfile = require('koa-sendfile')
const compressing = require('compressing')
const http = require('http')
const $util = require('./util')
const $crypto = require('./crypto')
module.exports = {
    /**
     * 得到小写的文件扩展名，去掉“。”。
     * @param {string} path 文件路径
     * @returns {string} 返回小写的文件扩展名例如：jpg,gif。
     */
    extname: function (filename){
        return path.extname(filename).replace('.', '').toLowerCase();
    },
    /**
     * 递归创建目录
     * @param {string} dirname 目录路径
     * @returns {boolean}
     */
    createFolder: function (dirname) {
        if (fs.existsSync(dirname)) {
            return true;
        } else {
            if (this.createFolder(path.dirname(dirname))) {
                fs.mkdirSync(dirname);
                return true;
            }
        }
    },
    /**
     * 删除文件
     * @param {string} filepath 文件路径
     * @returns {Promise<unknown>}
     */
    deleteFile: function (filepath) {
        return new Promise(async (resolve, reject) => {
            fs.unlink(filepath, (err) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(null)
                }
            })
        })
    },
    /**
     * 读取文件
     * @param {string} filepath 文件路径
     * @param {string} encoding 编码的参数 encoding为null时返回流。否则返回字符串
     * @returns {*}
     */
    readFile(filepath, encoding = "utf-8") { // 文件读取
        if (fs.existsSync(filepath)) {
            return fs.readFileSync(filepath, encoding);
        } else {
            throw new Error(filepath + "文件不存在")
        }
    },
    /**
     * 写文件
     * @param {string} filepath 文件路径
     * @param {string} data 文件数据
     * @param {string} encode 编码类型：默认为utf-8
     * @returns {Promise<unknown>}
     */
    writeFile: function (filepath, data, encode = 'utf-8') {
        return new Promise((resolve, reject) => {
            fs.writeFile(filepath, data, encode, (err) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(null)
                }
            })
        })
    },
    /**
     * 删除文件夹
     * @param {string} filepath 文件路径
     * @returns {Promise<unknown>}
     */
    deleteFolder: function (filepath) {
        let self = this;
        return new Promise(async (resolve, reject) => {
            let files = [];
            if (fs.existsSync(filepath)) {
                files = fs.readdirSync(filepath);
                await files.forEach(function (file, index) {
                    let curPath = path.join(filepath, file);
                    if (fs.statSync(curPath).isDirectory()) {
                        self.deleteFolder(curPath)
                    } else {
                        fs.unlinkSync(curPath)
                    }
                })
                fs.rmdirSync(filepath)
            }
            resolve()
        })
    },
    /**
     * 递归查询目录下的所有文件
     * @param {string} filepath 文件路径
     * @param {string} reg 查询的正规表达式：/^.*\.js$/
     */
    findFile: function (filepath, reg = "") {
        let listDir = function (dirpath) {
            let fileList = fs.readdirSync(dirpath);
            for (let i = 0; i < fileList.length; i++) {
                let stat = fs.lstatSync(path.join(dirpath, fileList[i]));
                let filename = fileList[i]
                // 是目录，需要继续
                if (stat.isDirectory()) {
                    listDir(path.join(dirpath, filename));
                } else {
                    if (_.isEmpty(reg)) {
                        resultFiles.push(path.join(dirpath, filename));
                    } else if (reg.test(filename)) {
                        resultFiles.push(path.join(dirpath, filename));
                    }
                }
            }
        }
        let resultFiles = []
        listDir(filepath);
        return resultFiles
    },
    /**
     * 得到当前目录下所有目录列表
     * @param {string} filepath 目录路径
     */
    getAllDir: function (filepath){
        return this.getAllDirFile(filepath,1)
    },
    /**
     * 得到当前目录下所有文件列表
     * @param {string} filepath 目录路径
     */
    getAllFile: function (filepath){
        return this.getAllDirFile(filepath,2)
    },
    /**
     * 得到当前目录下所有文件的列表（包括目录和文件）
     * @param {string} filepath 目录路径
     * @param {integer} type 过滤类型。type=0：所有文件。type=1：返回目录，type=2：返回文件
     */
    getAllDirFile: function (filepath, type = 0) {
        let filelist = [];
        let result = [];
        if (fs.existsSync(filepath)) {
            filelist = fs.readdirSync(filepath);
        }
        switch (type) {
            case 0://所有文件
                result = filelist;
                break;
            case 1://返回目录
                filelist.forEach(function (filename, index) {
                    try {
                        let info = fs.statSync(path.join(filepath, filename))
                        if (info && info.isDirectory()) {
                            result.push(filename)
                        }
                    } catch (e) {

                    }
                })
                break;
            case 2://返回文件
                filelist.forEach(function (filename, index) {
                    try {
                        let info = fs.statSync(path.join(filepath, filename))
                        if (info && !info.isDirectory()) {
                            result.push(filename)
                        }
                    } catch (e) {

                    }
                })
                break;
        }
        return result
    },
    /**
     * 重命名或者移动文件
     * @param {string} filepath 原路径
     * @param {string} newfilepath 新的路径
     * @returns {Promise<unknown>}
     */
    moveFile: function (filepath, newfilepath) {
        return new Promise(async (resolve, reject) => {
            if (fs.existsSync(filepath)) {
                this.createFolder(path.dirname(newfilepath))
                fs.rename(filepath, newfilepath, function (err) {
                    if (err) reject(err)
                    fs.stat(newfilepath, function (err, stats) {
                        if (err) reject(err)
                        //console.log('stats: ' + JSON.stringify(stats));
                        resolve();
                    });
                });
            }
        })
    },
    /**
     * 文件夹复制
     * @param {string} fromPath 源文件路径
     * @param {string} toPath 目标文件路径
     */
    copyForder: function (fromPath, toPath) {
        /*
         * 复制目录中的所有文件包括子目录
         * @param{ String } 需要复制的目录
         * @param{ String } 复制到指定的目录
         */

        let copy = function (src, dst) {
            // 读取目录中的所有文件/目录
            fs.readdir(src, function (err, paths) {
                if (err) {
                    throw err;
                }

                paths.forEach(function (path) {
                    let _src = src + '/' + path,
                        _dst = dst + '/' + path,
                        readable, writable;
                    stat(_src, function (err, st) {
                        if (err) {
                            throw err;
                        }
                        // 判断是否为文件
                        if (st.isFile()) {
                            // 创建读取流
                            readable = fs.createReadStream(_src);
                            // 创建写入流
                            writable = fs.createWriteStream(_dst);
                            // 通过管道来传输流
                            readable.pipe(writable);
                        }
                        // 如果是目录则递归调用自身
                        else if (st.isDirectory()) {
                            exists(_src, _dst, copy);
                        }
                    });
                });
            });
        };

        // 在复制目录前需要判断该目录是否存在，不存在需要先创建目录
        let exists = function (src, dst, callback) {
            fs.exists(dst, function (exists) {
                // 已存在
                if (exists) {
                    callback(src, dst);
                } else {
                    // 不存在
                    fs.mkdir(dst, function () {
                        callback(src, dst);
                    });
                }
            });
        };

        // 复制目录
        exists(fromPath, toPath, copy);
    },
    /**
     * 把文件转换成Base64编码
     * @param {string} filepath 文件路径
     * @returns {*} Base64编码
     */
    fileToBase64: function (filepath) {
        let data = fs.readFileSync(filepath);
        return Buffer.from(data, 'base64');
    },
    /**
     * 判断是否为目录
     * @param filepath
     */
    isDirectory:function (filepath){
        let info = fs.statSync(filepath)
        if (info && !info.isDirectory()) {
            return false;
        }
        return true;
    },
    /**
     * 判断是否为文件
     * @param filepath
     */
    isFile:function (filepath){
        return !this.isDirectory(filepath)
    },
    /**
     * 得到随机的UUID的文件名
     * @param {string} filename 文件名
     * @returns {string} 随机文件名
     * @constructor
     */
    UUIDFileName: function (filename) {
        return $util.UUID() + path.extname(filename).toLowerCase();
    },
    /**
     * 得到MD5的文件名
     * @param {string} filename 文件名
     * @returns {string} 随机文件名
     * @constructor
     */
    MD5FileName: function (filepath) {
        return $crypto.MD5(filepath) + path.extname(filepath).toLowerCase()
    },
    /**
     * 下载文件
     * @param ctx
     * @param {string} filepath 文件路径
     * @param {string} filename 下载的文件名 当有下载文件名是才会弹出下载对话框
     * @param {boolean} cache 是否缓存。默认为真
     * @returns {Promise<void>}
     */
    download: async function (ctx, filepath, filename, cache = true) {
        if (fs.existsSync(filepath)) {
            if (filename) {
                ctx.attachment(filename);
            }
            if (cache) {
                ctx.set('etag', 'max-age');
            }
            await sendfile(ctx, filepath);
        } else {
            let err = filepath + '所下载的文件不存在！'
            throw new Error(err)
        }
    },
    /**
     * 流的方式下载文件。像视频这样的用流的方式可以拖拽视频显示
     * @param {string} filepath 文件的本地路径
     * @returns {Promise<void>}
     */
    downloadStream: async function (ctx, filepath) {
        let info = fs.statSync(filepath)
        let range = ctx.request.headers.range;
        let positions = range.replace(/bytes=/, "").split("-");
        let start = parseInt(positions[0], 10);
        let total = info.size;
        let end = positions[1] ? parseInt(positions[1], 10) : total - 1;
        let chunksize = (end - start) + 1;
        ctx.response.status = 206;
        ctx.set('Content-Range', "bytes " + start + "-" + end + "/" + total);
        ctx.set('Accept-Ranges', "bytes");
        ctx.set('Content-Length', chunksize);
        ctx.set('Content-Type', "video/mp4");

        let stream = fs.createReadStream(filepath, {start: start, end: end});
        ctx.body = stream
    },
    /**
     * 从网上下载文件
     * @param url {string} 网上文件的路径
     * @param filepath {string} 文件保存的路径
     */
    urlDownload: async function (url, filepath) {
        return new Promise((resolve, reject) => {
            this.createFolder(path.dirname(filepath))
            //console.log(`  * Downloading from: ${url}`)
            let file = fs.createWriteStream(filepath, {autoClose: true})
            http.get(url, (res) => {
                const {statusCode} = res;//获取请求的状态码
                const contentType = res.headers['content-type'];//获取请求类型

                let error;
                if (statusCode !== 200) {
                    //如果请求不成功 （状态码200代表请求成功哦那个）
                    error = new Error('请求失败\n' +
                        `状态码: ${statusCode}`); //报错抛出状态码
                } else if (!/^application\/json/.test(contentType)) {
                    //验证请求数据类型是否为json数据类型   json的content-type :'content-type':'application/json'
                    //再次报错
                    error = new Error('无效的 content-type.\n' + `期望的是 application/json 但接收到的是 ${contentType}`);
                }
                if (error) {//如果报错了
                    reject(error);
                    res.resume();//将请求的错误存入日志文件
                    return;
                }
                res.pipe(file)
                file.on("finish", () => {
                    //console.log(filepath)
                    resolve(true)
                })
            }).on('error', (e) => {
                reject(e);
            });
        })
    },
    /**
     * 下载文件流
     * @param {string} url 网站路径
     * @returns {Promise<unknown>}
     */
    urlDownloadStream: async function (url) {
        return new Promise((resolve, reject) => {
            http.get(url, (res) => {
                /*response.pipe(file)
                file.on("finish",() => {
                    //console.log(filepath)
                    resolve(true)
                })*/
                /*const { statusCode } = res;//获取请求的状态码

                const contentType = res.headers['content-type'];//获取请求类型

                let error;
                if (statusCode !== 200) {//如果请求不成功 （状态码200代表请求成功哦那个）
                    error = new Error('请求失败\n' + `状态码: ${statusCode}`); //报错抛出状态码
                } else if (!/^application\/json/.test(contentType)) {//验证请求数据类型是否为json数据类型   json的content-type :'content-type':'application/json'
                    error = new Error('无效的 content-type.\n' + `期望的是 application/json 但接收到的是 ${contentType}`);//再次报错
                }
                if (error) {//如果报错了
                    reject(error);
                    res.resume();//将请求的错误存入日志文件
                    return;
                }*/
                //请求成功
                res.setEncoding('binary');//字符编码设为万国码
                let rawData = '';//定义一个字符变量
                res.on('data', (chunk) => {
                    rawData += chunk;
                });//通过data事件拼接数据流得到数据
                res.on('end', () => {//end表示获取数据结束了
                    try {  //捕获错误信息
                        resolve(Buffer.from(rawData, "binary"))
                    } catch (err) {
                        reject(err);
                    }
                });
                res.on("error", function (err) {
                    reject(err);
                });
            }).on('error', (e) => {
                reject(e);
            });
        })
    },
    /**
     * 压缩文件 例子await compressing.zip.compressDir('d:/abc.doc','d:/nodejs-compressing-demo.zip')
     * @param {string} sourcePath 源路径
     * @param {string} destZipPath ZIP文件目标路径
     * @returns {Promise<void>}
     */
    zipfile: async function (sourcePath, destZipPath) {
        await compressing.zip.compressDir(sourcePath, destZipPath)
    },
    /**
     * 解压文件 例子await compressing.zip.uncompress('d:/nodejs-compressing-demo.zip', 'd:/nodejs-compressing-demo')
     * @param {string} sourceZipPath  ZIP文件目标路径
     * @param {string} destDir 目标目录
     * @returns {Promise<void>}
     */
    unzipfile: async function (sourceZipPath, destDir) {
        await compressing.zip.uncompress(sourceType, destType)
    },

};
