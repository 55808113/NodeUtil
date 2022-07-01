/**
 * 上传文件类
 */
const multer = require('koa-multer')
const path = require('path')
const Busboy = require('busboy')
//常用的js函数类
const _ = require('lodash')
const $file = require('./file')
const $util = require('./util')

module.exports = {
    options:{
        /**
         * 上传的路径可以默认设置 $conf.configuration.photopath;
         */
        uploadpath: path.join(process.cwd(), '/upload/upload')
    },
    init: function (opts){
        _.assign(this.options,opts)
    },
    /*上传文件
    * uploadpath:上传的文件目录路径
    * fn返回上传的文件名称，大小，路径名称
    * isRename:是否随机命名
     */
    /*uploadfile: function (req, res, uploadpath, fn, isRename) {
        //let utilObj = this
        isRename = isRename || true;
        let fname = "";
        let fpath = "";
        let fsize = 0;
        // 获取前台页面传过来的参数
        req.busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
            console.log('File [' + fieldname + ']: filename: ' + filename + ', encoding: ' + encoding + ', mimetype: ' + mimetype);

            if (filename !== "") {
                fname = path.basename(filename);
                if (isRename) {
                    let extname = path.extname(filename);
                    fpath = uuid.v1() + extname;
                }
                else {
                    fpath = fname;
                }
                let saveTo = path.join(uploadpath, fpath);//$conf.configuration.photopath
                console.log(saveTo);
                let fstream = fs.createWriteStream(saveTo);
                file.pipe(fstream);
            }
            file.on('limit', function () {
                throw "文件不能超过10M"
                //utilObj.resultFAIL(ctx, '文件不能超过10M');
                return
            });
            file.on('data', function (data) {
                console.log('File [' + fieldname + '] got ' + data.length + ' bytes');
                fsize = fsize + data.length;
            });
            file.on('end', function () {
                console.log('File [' + fieldname + '] Finished');
            });
        });
        //监听finish完成事件,完成后重定向到百度首页
        req.busboy.on('finish', function () {
            fn(fname, fpath, fsize);
        });
        /!*req.busboy.on('finish', function () {
            // 业务逻辑代码
            res.redirect('/wdsdcj');
        });*!/
        req.pipe(req.busboy);
    },*/
    /**
     * 上传文件
     * @param ctx
     * @param extArr 要上传的文件扩展名。'*'是所有文件，默认上传：["jpg","png","xlsx","docx"]。
     * @returns {Promise<unknown>}
     */
    uploadfile(ctx,extArr='*') {
        let uploadData = null;
        return new Promise((resolve, reject) => {
            const _emmiter = new Busboy({headers: ctx.req.headers})

            _emmiter.on('file', function (fieldname, file, filename, encoding, mimetype) {

                let extension = $file.extname(filename);
                if (extArr != '*' && extArr.indexOf(extension) == -1) {
                    reject('你上传的文件类型['+ extension+'],不在允许上传的文件类型['+extArr+']里，请重新选择文件！')
                    return
                }
                console.log(`File [${fieldname}]: filename: ${filename}, encoding: ${encoding}, mimetype: ${mimetype}`);
                file.on('limit', function () {
                    //$util.resultFAIL(ctx, '文件不能超过10M');
                    reject('文件不能超过10M')
                    return
                });
                file.on('data', function (data) {
                    console.log(`File [${fieldname}] got ${data.length} bytes`);
                    if (!uploadData) {
                        uploadData = data;
                    } else {
                        uploadData = Buffer.concat([uploadData, data]);
                    }
                });
                file.on('end', function () {
                    if (filename !== "" && uploadData) {
                        resolve(uploadData)
                    } else {
                        reject("上传文件不存在！")
                    }
                });
            });
            /*req.busboy.on('finish', function () {
                // 业务逻辑代码
                res.redirect('/wdsdcj');
            });*/
            _emmiter.on('finish', function () {
                console.log('finished...')
            })

            _emmiter.on('error', function (err) {
                console.log('err...')
                reject(err)
            })
            //下面的语句把post里的其它参数数据赋值到ctx.request.body里
            _emmiter.on('field', (fieldName, value) => {
                ctx.request.body[fieldName] = value
            })
            ctx.req.pipe(_emmiter)
        })
    },
    /**
     * 使用multer插件上传文件。支持上传时带其它参数。
     * @param {string[]} extArr 要上传的文件扩展名。'*'是所有文件，默认上传：["jpg","png","xlsx","docx"]。
     * @param callback 上传设置上传的文件名.如果没有设置就随机
     * @returns {*}
     */
    multerUploadfile: function (extArr, callback) {
        let opts = this.options
        extArr = extArr || ["jpg", "png", "xlsx", "docx"]
        let uploadpath = opts.uploadpath
        if ($util.isEmpty(uploadpath)) {
            uploadpath = path.join(process.cwd(), 'upload')
        }
        $file.createFolder(uploadpath);

        // 通过 filename 属性定制
        let storage = multer.diskStorage({
            destination: function (req, file, cb) {
                // 接收到文件后输出的保存路径（若不存在则需要创建）
                cb(null, uploadpath);    // 保存的路径，备注：需要自己创建
            },
            filename: function (req, file, cb) {
                // 将保存文件名设置为 时间戳 + 文件原始名，比如 151342376785-123.jpg
                let originalname
                if (callback) {
                    originalname = callback(file.originalname)
                } else {
                    let [name, type] = file.originalname.split('.');
                    originalname = `${name}_${Date.now().toString(16)}.${type}`
                    //originalname = $file.UUIDFileName(file.originalname)
                }
                cb(null, originalname)
            }
        })
        let fileFilter = (req, file, cb) => {
            //过滤上传的后缀为txt的文件
            let extension = $file.extname(file.originalname)
            if (extArr.indexOf(extension) != -1 || extArr == '*') {
                cb(null, true);
            } else {
                cb("你上传文件类型["+extension+"]不在允许的文件类型["+ extArr + "]里，请重新选择文件！", false);
            }
        }
        return multer({storage: storage, fileFilter: fileFilter});
    }
};
