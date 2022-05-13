/**
 * 操作Excel相关函数
 *
 * */
const nodeExcel = require('excel-export')
const xlsx = require('xlsx')
const _ = require('lodash')
const fs = require('fs')
//const xlsx = require('xlsx-style');//选择使用xlsx-style可以设置表格样式
const ejsexcel = require("ejsexcel")
const path = require('path')
const $util = require('./util')
const $convert = require('./convert')
const $upload = require('./upload')
const $file = require('./file')
const $sqlhelper = require('./mysql-helper')

module.exports = {
    //////////////////////////////////EXCEL文件操作/////////////////////////////////////////
    /**
     * 错误的文件目录
     */
    impFailpath: path.join(process.cwd(), '/upload/ImpErr'),
    /**
     * 对导入的headers进行排序和过滤
     * @param headers
     */
    orderByheaders: function (headers) {
        let rows = [];

    },
    /**
     * mssql的类型转换为excel的类型
     * @param datatype
     */
    convertMssqlType: function (datatype){
        let result = datatype
        switch (datatype){
            case "bit":
                result = "bool";
                break;
            case "char":
                result = "string";
                break;
            case "nchar":
                result = "string";
                break;
            case "varchar":
                result = "string";
                break;
            case "nvarchar":
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
            case "double":
                result = "number";
                break;
            case "real":
                result = "number";
                break;
            case "numeric":
                result = "number";
                break;
        }
        return result;
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
            case "double":
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

        function getConf(){
            function getCol(title, type) {
                //格式判断
                function format(val, opt) {
                    let type = opt.cellType;

                    /*function addzero(v) {
                        if (v < 10) return '0' + v;
                        return v.toString();
                    }*/
                    switch (type){
                        case "date":
                            opt.cellType = "string";
                            val = $convert.getDateString(val)
                            break;
                        case "datetime":
                            opt.cellType = "string";
                            val = $convert.getDateTimeString(val)
                            break;
                        case "bool":
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
                            break;
                        case "number":
                            val = $convert.getNumber(val,null)
                            break;
                    }

                    return val;
                }
                let col = {};
                col.caption = title;
                //所有的属性类型都是string
                col.type = type
                //width不好使
                //col.width = 50.7109375
                //标题的样式索引
                //<cellXfs count="4">
                //     <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
                //     <xf numFmtId="14" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
                //     <xf numFmtId="14" fontId="0" fillId="2" borderId="1" xfId="1" applyNumberFormat="1" applyFont="1"/>
                //     <xf numFmtId="0" fontId="0" fillId="2" borderId="1" xfId="1" applyFont="1"/>
                //   </cellXfs>
                // 这个就是style.xml这个节点cellXfs中的索引号。
                col.captionStyleIndex = 2;
                //日期格式要改变成string否则显示有问题
                col.beforeCellWrite = function (row, cellData, eOpt) {
                    let value = format(cellData, eOpt);
                    return value;
                }
                return col
            }
            let conf = {};
            //可以设置样式
            conf.stylesXmlFile = path.join(__dirname,"excel_styles.xml");
            conf.name = "sheet";
            conf.cols = [];
            for (let item of headers) {
                //判断json数据并且在headers上生成需要的对象
                if (item.type == "json") {
                    item.content = []
                    for (let i in item.templaterows) {
                        let templates = item.templaterows[i]
                        let content = JSON.parse(templates.content);
                        item.content = item.content.concat(content)
                    }
                    item.content.forEach(function (n) {
                        let type = "string"
                        switch (n.type){
                            case "booleanfield":
                                type = "bool"
                                break;
                            case "numberfield":
                                type = "number"
                                break;
                            case "datetimefield":
                                type = "string"
                                break;
                            case "datefield":
                                type = "string"
                                break;
                        }
                        let col = getCol(n.label, type)
                        conf.cols.push(col);
                    })
                } else {
                    let col = getCol(item.title, item.type)
                    conf.cols.push(col);
                }
            }
            return conf
        }
        //得到数据
        function getDatas(){
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
                        //得到有data类型的话。取真实数据的值
                        if ($util.isNotEmpty(item.data)){
                            let index = _.findIndex(item.data,['value',val])
                            if (index!=-1){
                                val = item.data[index].text
                            }
                        }
                        data.push($convert.getObject(val))
                    }
                }
                datas.push(data);
            }
            return datas
        }
        if ($util.isEmpty(rows)){
            throw new Error("没有查询到要导出的数据！")
        }
        let conf = getConf()
        conf.rows = getDatas();
        return Buffer.from(nodeExcel.execute(conf), 'binary');
    },
    /**
     * 导出excel
     * @param ctx
     * @param {string} title 导出的文件名
     * @param {object} headerObj 导出的头文件格式对象
     * @param {object[]} rows 导出的数据
     * 例子 let headers = {};
     headers.sfzh = $message.card.sfzh;
     headers.xm = $message.card.xm;
     headers.xb = $message.card.xb;
     $excel.expExcel(ctx, $message.card.title, headers, rows);
     */
    expExcel: function (ctx, title, headerObj, rows) {
        let cols = []
        for (let key in headerObj) {
            let item = headerObj[key]
            /*//不是对象继续执行
            if (!_.isObject(item)) continue*/
            let columntype = "string"
            if (item.type) columntype = item.type
            let col = {
                name: key,
                type: columntype,
                title: item.title,
                order: item.order,
                /**
                 * 像类型这样的，这个是类型对应的名称
                 * data: [
                 {text:"人员",value:"0"},
                 {text:"科室",value:"1"}
                 ]
                 */
                data: item.data,
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
     * @param {object} colresults 导出的头文件格式
     * @param {object[]} rows 导出的数据
     */
    expExcelbyData: function (ctx, title, colresults, rows) {
        let headers = {};
        for (let key in colresults) {
            let item = colresults[key]
            if ($convert.getBool(item.sfdc)) {
                headers[key] = item
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
        let templateFs = $file.readFile(path.join(process.cwd(), templatePath),'')
        return new Promise((resolve, reject) => {
            ejsexcel.renderExcelCb(templateFs, rows, function (err, exlBuf) {
                if (err) {
                    reject(new Error('[EXCEL生成失败!]:' + path.basename(templatePath) + err.message))
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
     * @param {sql: string, onUploadFileSuccess: function,onSetParams:function } opts  sql语句
     * @returns {Promise<{fail: number, success: number, failfilename: string}>}
     * {
     *   fail: number, //错误的个数
     *   success: number, //成功的个数
     *   failfilename: string //错误的文件名
     * }
     */
    impExcel: async function (ctx, opts) {
        //文件数据转xlsx格式
        function xlsxDatatoJson(xlsData) {
            let workbook = xlsx.read(xlsData);
            let sheetNames = workbook.SheetNames; // 返回 ['sheet1', 'sheet2',……]
            let worksheet = workbook.Sheets[sheetNames[0]];// 获取excel的第一个表格
            return xlsx.utils.sheet_to_json(worksheet);
        }
        //转换为导出模板的类型
        function convertType(data){
            let result = "string"
            if (typeof data == "string"){
                result = "string"
            }else if(typeof data == "number"){
                result = "number"
            }else if (typeof data == "date"){
                result = "date"
            }
            return result
        }
        let options = {
            sql:"",
            //上传文件成功事件:让程序取得一些参数
            onUploadFileSuccess: async function (ctx){

            },
            //设置参数
            onSetParams:async function (item){

            }
        }
        options = _.assign({},options,opts)
        try {
            let filepath = this.impFailpath
            let uploaddata = await $upload.uploadfile(ctx,["xls","xlsx"])
            await options.onUploadFileSuccess.call(this,ctx)
            let rows = xlsxDatatoJson(uploaddata)
            let failInfos = []
            let resultInfo = {success: 0, fail: 0, failfilename: $file.UUIDFileName("err.xlsx")}
            let connection = await $sqlhelper.getConn();
            try {
                for (let i = 0; i < rows.length; i++) {
                    let item = rows[i];
                    try {
                        let param = await options.onSetParams.call(this,item)
                        if (!param) {
                            throw "callbackParam参数没有设置插入的数据！"
                        }
                        //如果返回数组代表是一下导入多条数据。
                        if (_.isArray(param)){
                            for (const paramElement of param) {
                                await $sqlhelper.execSqlByConn(connection, options.sql, paramElement)
                            }
                        }else{
                            await $sqlhelper.execSqlByConn(connection, options.sql, param)
                        }
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
                    headers.push({name: key, title: key, type: convertType(failinfo[key])})
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
