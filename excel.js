/**
 * 操作Excel相关函数
 *
 * */

const nodeExcel = require('excel-export')
const xlsx = require('xlsx')
const _ = require('lodash')
//const xlsx = require('xlsx-style');//选择使用xlsx-style可以设置表格样式
const ejsexcel = require("ejsexcel")
const path = require('path')
const $convert = require('./convert')
const $upload = require('./upload')
const $file = require('./file')
const $sqlhelper = require('./mysql-helper')
const $util = require('./util')
module.exports = {
    //////////////////////////////////EXCEL文件操作/////////////////////////////////////////
    /**
     * 错误的文件目录
     */
    impFailpath: path.join(__dirname, '/../../upload/ImpErr'),
    /**
     * 对导入的headers进行排序和过滤
     * @param headers
     */
    orderByheaders: function (headers) {
        let rows = [];

    },
    /**
     * mysql的类型转换为excel的类型
     * @param datatype
     */
    convertMysqlType: function (datatype){
        let result = datatype
        switch (datatype){
            case "tinyint":
                result = "bool";
                break;
            case "char":
                result = "string";
                break;
            case "varchar":
                result = "string";
                break;
            case "text":
                result = "string";
                break;
            case "int":
                result = "number";
                break;
            case "smallint":
                result = "number";
                break;
            case "float":
                result = "number";
                break;
        }
        return result;
    },
    /**
     * 导出excel数据流
     * @param {string} title 导出的文件名
     * @param {object[]}  headers 导出的头文件格式 [{name : key,type : item.type,title : item.title,order : item.order,templaterows : item.templaterows}, {name : key,type : item.type,title : item.title,order : item.order,templaterows : item.templaterows}]
     * @param {object[]} rows 导出的数据
     * @returns {*}
     */
    expExcelStream: function (title, headers, rows) {
        //格式判断
        function format(val, opt) {
            let type = opt.cellType;

            function addzero(v) {
                if (v < 10) return '0' + v;
                return v.toString();
            }

            if (type == "date") {
                opt.cellType = "string";
                val = $convert.getDateString(val)
            } else if (type == "datetime") {
                opt.cellType = "string";
                val = $convert.getDateTimeString(val)
            } else if (type == "bool") {
                opt.cellType = "string";
                if (!$util.isEmpty(val)) {
                    if ($convert.getBool(val)) {
                        val = "是";
                    } else {
                        val = "否";
                    }
                } else {
                    val = "";
                }
            }
            return val;
        }

        function getCol(title, type) {
            let col = {};
            col.caption = title;
            //所有的属性类型都是string
            col.type = type
            //日期格式要改变成string否则显示有问题
            col.beforeCellWrite = function (row, cellData, eOpt) {
                let value = format(cellData, eOpt);
                return value;
            }
            return col
        }

        //判断json数据并且在headers上生成需要的对象
        for (let item of headers) {
            if (item.type == "json") {
                item.content = []
                for (let i in item.templaterows) {
                    let templates = item.templaterows[i]
                    let content = JSON.parse(templates.content);
                    item.content = item.content.concat(content)
                }
            }
        }
        let conf = {};
        //可以设置样式
        conf.name = "sheet";
        conf.cols = [];
        for (let item of headers) {
            if (item.type == "json") {
                item.content.forEach(function (n) {
                    let type = "string"
                    if (n.type == "booleanfield") {
                        type = "bool"
                    }
                    let col = getCol(n.label, type)
                    conf.cols.push(col);
                })
            } else {
                let col = getCol(item.title, item.type)
                conf.cols.push(col);
            }
        }
        let datas = [];
        for (let i = 0; i < rows.length; i++) {
            let data = []
            let row = rows[i]
            for (let item of headers) {
                let val = row[item.name]
                if (item.type == "json") {
                    let dataObj = JSON.parse(val)
                    for (let n of item.content) {
                        let value = ""
                        if (!_.isEmpty(dataObj)) {
                            for (let key in dataObj.data) {
                                if (n.fieldName == key) {
                                    value = dataObj.data[key]
                                    if (n.type == "comboboxfield") {
                                        let valueArr = value.split(',')
                                        let nameArr = []
                                        for (let res of n.singleOption) {
                                            if (valueArr.indexOf(res.itemValue) != -1) {
                                                nameArr.push(res.itemName)
                                            }
                                        }
                                        value = nameArr.join(',')
                                    }
                                    break;
                                }
                            }
                        }
                        data.push($convert.getObject(value))
                    }
                } else {
                    data.push($convert.getObject(val))
                }
            }
            datas.push(data);
        }
        conf.rows = datas;
        return Buffer.from(nodeExcel.execute(conf), 'binary');
    },
    /**
     * 导出excel
     * @param ctx
     * @param {string} title 导出的文件名
     * @param {object[]} headerObj 导出的头文件格式对象
     * @param {object[]} rows 导出的数据
     */
    expExcel: function (ctx, title, headerObj, rows) {
        let cols = []
        for (let key in headerObj) {
            let item = headerObj[key]
            let col = {
                name: key,
                type: item.type,
                title: item.title,
                order: item.order,
                //模板的字段
                templaterows: item.templaterows
            };
            cols.push(col);
        }
        cols = _.orderBy(cols, ['order'], ['asc']);
        let excelStream = this.expExcelStream(title, cols, rows)
        ctx.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        ctx.set("Content-Disposition", "attachment; filename=" + encodeURIComponent(title) + ".xlsx");
        ctx.body = excelStream
    },
    /**
     * 根据配置的信息表导出excel
     * @param ctx
     * @param {string} title 导出的文件名
     * @param {object[]} colresults 导出的头文件格式
     * @param {object[]} rows 导出的数据
     */
    expExcelbyData: function (ctx, title, colresults, rows) {
        let headers = {};
        for (let i = 0; i < colresults.length; i++) {
            let item = colresults[i]
            if ($convert.getBool(item.sfdc)) continue
            let columntype = "string"
            if (item.columntype == "DATETIME") {
                columntype = "datetime"
            } else if (item.columntype == "NUMBER") {
                columntype = "number"
            }
            headers[item.tablecolumn] = {
                title: item.columnname,
                type: columntype,
                order: item.order,
                //模板的字段
                templaterows: item.templaterows
            }
        }
        this.expExcel(ctx, title, headers, rows);
    },
    /**
     * 根据Excel模板导出excel
     * @param ctx
     * @param {string} title 导出的文件名
     * @param {string} templatePath Excel模板文件路径
     * @param {object[]} rows 导出的数据
     * @returns {Promise<unknown>}
     */
    expExcelbyTemplate: function (ctx, title, templatePath, rows) {
        let templateFs = $file.readFile(templatePath)
        return new Promise((resolve, reject) => {
            ejsexcel.renderExcelCb(templateFs, rows, function (err, exlBuf) {
                if (err) {
                    reject(new Error('[EXCEL生成失败!]:' + templatePath + err.message))
                    return;
                }
                ctx.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                ctx.set("Content-Disposition", "attachment; filename=" + encodeURIComponent(title) + ".xlsx");
                ctx.body = exlBuf
                resolve()
            })
        })
    },
    /**
     * 导入excel文件
     * @param ctx
     * @param {string} sql sql语句
     * @param {function} callbackParam 设置执行sql的参数返回参数
     * @returns {Promise<{fail: number, success: number, failfilename: string}>}
     * {
     *   fail: number, //错误的个数
     *   success: number, //成功的个数
     *   failfilename: string //错误的文件名
     * }
     */
    impExcel: async function (ctx, sql, callbackParam) {
        //文件数据转xlsx格式
        function xlsxDatatoJson(xlsData) {
            let workbook = xlsx.read(xlsData);
            let sheetNames = workbook.SheetNames; // 返回 ['sheet1', 'sheet2',……]
            let worksheet = workbook.Sheets[sheetNames[0]];// 获取excel的第一个表格
            return xlsx.utils.sheet_to_json(worksheet);
        }

        try {
            let filepath = this.impFailpath
            let uploaddata = await $upload.uploadfile(ctx,["xls","xlsx"])
            let rows = xlsxDatatoJson(uploaddata)
            let failInfos = []
            let resultInfo = {success: 0, fail: 0, failfilename: $file.UUIDFileName("err.xlsx")}
            let connection = await $sqlhelper.getConn();
            try {
                for (let i = 0; i < rows.length; i++) {
                    let item = rows[i];
                    try {
                        let param = callbackParam(item)
                        if (!param) {
                            throw "callbackParam参数没有设置插入的数据！"
                        }
                        await $sqlhelper.execSqlByConn(connection, sql, param)
                        resultInfo.success = resultInfo.success + 1;
                    } catch (err) {
                        let info = _.assign({}, item, {"错误行号": String(i + 2), "错误内容": err.message})
                        //把导入的所有数据放到info里
                        failInfos.push(info)
                    }
                }
                connection.release();
            } catch (err) {
                connection.release();
                throw err
            }

            resultInfo.fail = failInfos.length;
            //如果有错误的话。把错误信息保存到本地让客户下载
            if (resultInfo.fail > 0) {

                $file.createFolder(filepath)

                let headers = [];
                let failinfo = failInfos[0];
                for (let key in failinfo) {
                    headers.push({name: key, title: key, type: "string"})
                }
                let excelStream = this.expExcelStream("错误导入数据", headers, failInfos)
                $file.writeFile(path.join(filepath, resultInfo.failfilename), excelStream)
            }
            return resultInfo
        } catch (err) {
            throw err
        }
    }
    //==============================================================
};
