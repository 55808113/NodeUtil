/**
 * 生成easyuitree控件函数
 * var dataBinding = {
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
const path = require("path")
const handlebars = require("handlebars")
const pdf = require('html-pdf')
module.exports = {
    /**
     * 导出pdf文件并下载
     * @param ctx
     * @param {string} jsondata 需要显示的数据
     * @param {string} htmlpath 需要显示的样式通过html设计
     * @param {string} title 文件的名称
     * @returns {Promise<unknown>}
     */
    pdfDownload: function (ctx, jsondata, htmlpath, title) {
        let finalHtml = this.templateToHtml(jsondata, htmlpath)
        title = title || 'data'
        //let options = { format: 'Letter' };
        return new Promise((resolve, reject) => {
            pdf.create(finalHtml).toBuffer(function (err, buffer) {
                if (err) {
                    reject(err)
                    return;
                }
                //添加attachment; 以后文件就会出现下载对话框
                ctx.set("Content-Disposition", "attachment; filename=" + encodeURIComponent(title) + ".pdf");
                ctx.body = buffer
                resolve()
                //console.log('This is a buffer:', Buffer.isBuffer(buffer));
            })
        })
    },
    /**
     * 导出pdf文件在IE中浏览
     * @param ctx
     * @param {string} jsondata 需要显示的数据
     * @param {string} htmlpath 需要显示的样式通过html设计
     * @param {string} title 文件的名称
     * @returns {Promise<unknown>}
     */
    pdfPreview: function (ctx, jsondata, htmlpath, title) {
        let finalHtml = this.templateToHtml(jsondata, htmlpath)
        title = title || 'data'
        //let options = { format: 'Letter' };
        return new Promise((resolve, reject) => {
            pdf.create(finalHtml).toBuffer(function (err, buffer) {
                if (err) {
                    reject(err)
                    return;
                }
                ctx.set("Content-Disposition", "filename=" + encodeURIComponent(title) + ".pdf");
                ctx.set("Content-Type", "application/pdf")
                ctx.body = buffer
                resolve()
                //console.log('This is a buffer:', Buffer.isBuffer(buffer));
            })
        })
    },
    /**
     * 根据模板生成html文件
     * @param {string} jsondata 需要显示的数据
     * @param {string} htmlpath 需要显示的样式通过html设计
     * @returns {*}
     */
    templateToHtml: function (jsondata, htmlpath) {
        let templateHtml = fs.readFileSync(path.join(process.cwd(), htmlpath), 'utf8');
        let template = handlebars.compile(templateHtml);
        return template(jsondata);
    }
};
