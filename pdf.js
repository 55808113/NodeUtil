/**
 * 生成easyuitree控件函数
 * let dataBinding = {
        items: [{
                name: "item 1",
                price: 100
            },
            {
                name: "item 2",
                price: 200
            },
            {
                name: "item 3",
                price: 300
            }
        ],
        total: 600,
        isWatermark: true
    }
 * htmlpdf.pdf(dataBinding,'invoice.html'
 * */
const fs = require("fs")
const _ = require('lodash')
const path = require("path")
const handlebars = require("handlebars")
const htmlpdf = require('html-pdf')
class pdf {
    options = {
        //使用前需要设置一下phantomPath的路径。
        phantomPath:path.join(process.cwd(),"lib/phantomjs-2.1.1-window/bin/phantomjs.exe")
    }
    init(opts){
        _.assign(this.options,opts)
    }
    /**
     * 导出pdf文件并下载
     * @param ctx
     * @param {string} jsondata 需要显示的数据
     * @param {string} htmlpath 需要显示的样式通过html设计
     * @param {string} title 文件的名称
     * @param {boolean} bPreview pdf文件在IE中浏览而不是下载。默认为false。是下载
     * @returns {Promise<unknown>}
     */
    pdfDownload (ctx, jsondata, htmlpath, title, bPreview = false) {
        let finalHtml = this._templateToHtml(jsondata, htmlpath)
        title = title || 'data'
        let opts = this.options
        let phantomPath = opts.phantomPath
        //let options = { format: 'Letter' };
        return new Promise((resolve, reject) => {
            htmlpdf.create(finalHtml,{phantomPath:phantomPath}).toBuffer(function (err, buffer) {
                if (err) {
                    reject(err)
                    return;
                }
                //添加attachment; 以后文件就会出现下载对话框
                ctx.set("Content-Disposition", "attachment; filename=" + encodeURIComponent(title) + ".pdf");
                if (bPreview){
                    ctx.set("Content-Type", "application/pdf")
                }
                ctx.body = buffer
                resolve()
                //console.log('This is a buffer:', Buffer.isBuffer(buffer));
            })
        })
    }
    /**
     * 导出pdf文件在IE中浏览
     * @param ctx
     * @param {string} jsondata 需要显示的数据
     * @param {string} htmlpath 需要显示的样式通过html设计
     * @param {string} title 文件的名称
     * @returns {Promise<unknown>}
     */
    async pdfPreview (ctx, jsondata, htmlpath, title) {
        await this.pdfDownload(ctx, jsondata, htmlpath, title,true);
    }
    /**
     * 根据模板生成html文件
     * @param {string} jsondata 需要显示的数据
     * @param {string} htmlpath 需要显示的样式通过html设计
     * @returns {*}
     */
    _templateToHtml (jsondata, htmlpath) {
        let templateHtml = fs.readFileSync(path.join(process.cwd(), htmlpath), 'utf8');
        let template = handlebars.compile(templateHtml);
        return template(jsondata);
    }
};
module.exports = new pdf()