/**
 文件处理的函数
 */

const path = require('path')
const fs = require('fs')
const async = require('async')
const maxworkers = require('os').cpus().length
const resizeImg = require('resize-img')
const $file = require('./file')
const $crypto = require('./crypto')
const _ = require('lodash')

module.exports = {
    /**
     * 缩略图目录
     */
    thumbnailpath: path.join(__dirname, "../../thumb/"),
    /**
     * 生成缩略图
     * @param {string} filepath 文件路径
     * @param {string} thumbnailname 缩略图文件名
     * @param {json} option 参数
     * @param {int} imgW 图片的宽度
     */
    resizeimg: function (filepath, thumbnailname, option) {
        let smallfilename = thumbnailname || this.getSmallImgName(filepath);
        option = option || {}
        option = _.assign({},{width:200},option)
        resizeImg(fs.readFileSync(filepath), {width: option.width, height: option.height}).then(function (buf) {
            fs.writeFileSync(smallfilename, buf);
        });
        /*} else {
            images(filepath) //Load image from file
                //加载图像文件
                .size(option.width, option.height) //Geometric scaling the image to 400 pixels width
                //等比缩放图像到400像素宽
                //.draw(images("logo.png"), 10, 10) //Drawn logo at coordinates (10,10)
                //在(10,10)处绘制Logo
                .save(smallfilename, { //Save the image to a file, with the quality of 50
                    quality: 50 //保存图片到文件,图片质量为50
                });
        }*/
    },
    /**
     * 得到缩略图地址
     * @param {string} filepath 文件路径
     * @returns {string} 返回缩略图名称
     */
    getSmallImgName: function (filepath) {
        let dir = path.dirname(filepath);
        let filename = path.basename(filepath);
        return path.join(dir, "small" + filename);
    },
    /**
     * 得到缩略图路径
     * @param {string} filepath 原路径
     */
    getThumbnailpath: function (filepath) {
        return path.join(this.thumbnailpath, $crypto.MD5(filepath) + path.extname(filepath).toLowerCase());
    },
    /**
     * 生成缩略图返回名称
     * @param {string} filedir 图片文件的目录
     * @param {json} option 参数
     */
    thumbnail: function (filedir, option) {
        function resize(params) {
            //多线程的任务，非常的好用。方便进行大量数据处理时使用。
            let queue = async.queue(resizeimg, maxworkers);
            //let queue = async.auto(resizeimg);
            fs.readdir(params.srcdir, function (err, files) {
                files.forEach(function (file) {
                    //如果不是图片返回空值
                    if (_.indexOf(['png', 'jpg', 'jpeg', 'bmp'], $file.extname(file)) == -1) return false
                    let srcfilepath = path.join(params.srcdir, file)
                    let destfilepath = obj.getThumbnailpath(srcfilepath)
                    if (fs.existsSync(destfilepath)) return false
                    queue.push({
                        src: srcfilepath,
                        dest: destfilepath,
                        width: params.width,
                        height: params.height
                    })
                });
            });
        }

        function resizeimg(params, callback) {
            var imoptions = {
                srcPath: params.src,
                dstPath: params.dest
            };
            if (params.width !== undefined) imoptions.width = params.width;
            if (params.height !== undefined) imoptions.height = params.height;
            //if (win) {
            fs.readFile(imoptions.srcPath, function (err, data) {
                if (err) throw err;
                resizeImg(data, {width: imoptions.width, height: imoptions.height}).then(function (buf) {
                    fs.writeFileSync(imoptions.dstPath, buf);
                    //这句话的作用是执行完了，继续执行下面的任务。否则对列开始是8个。运行完8个就不再继续执行了。
                    callback(null, {resizeimg, maxworkers});
                });
            })
            /*} else {
                images(imoptions.srcPath) //Load image from file
                    //加载图像文件
                    .size(imoptions.width, imoptions.height) //Geometric scaling the image to 400 pixels width
                    //等比缩放图像到400像素宽
                    //.draw(images("logo.png"), 10, 10) //Drawn logo at coordinates (10,10)
                    //在(10,10)处绘制Logo
                    .save(imoptions.dstPath, { //Save the image to a file, with the quality of 50
                        quality: 50 //保存图片到文件,图片质量为50
                    });
            }*/
        }

        let obj = this
        //如果不是图片返回空值
        //if (_.indexOf(['.png', '.jpg', '.jpeg', '.bmp'], path.extname(filepath).toLowerCase()) == -1) return false
        option = _.assign({width: 64, height: 64, quality: 40}, option)
        //通过md5加密得到唯一的名称
        //thumbnailname = $crypto.MD5(filepath);
        $file.createFolder(this.thumbnailpath)

        resize({
            srcdir: filedir,
            //destdir: this.thumbnailpath,
            width: option.width,
            height: option.height
        });
        /*gm(filepath).thumb(option.width, // Width
            option.height, // Height
            filename, // Output file name
            option.quality, // Quality from 0 to 100
            function (error, stdout, stderr, command) {
                if (!error) {
                    console.log(command);
                } else {
                    console.log(error);
                }
            });*/
        return true;
    }

};
