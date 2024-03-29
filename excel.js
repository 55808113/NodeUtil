/**
 * 操作Excel相关函数
 *
 * */
const nodeExcel = require('@sunxdd/excel-export')
const xlsx = require('xlsx')
const _ = require('lodash')
//const xlsx = require('xlsx-style');//选择使用xlsx-style可以设置表格样式
const ejsexcel = require("ejsexcel")
const path = require('path')
const $util = require('./util')
const $convert = require('./convert')
const $upload = require('./upload')
const $file = require('./file')
/**
 * 数据类型
 * @type {{}}
 */
const DATA_TYPE = {
    /**
     * JSON的类型
     */
    json:"json",
    /**
     * 字符串类型
     */
    string:"string",
    /**
     * 数值类型
     */
    number:"number",
    /**
     * bool类型
     */
    bool:"bool",
    /**
     * 日期类型
     */
    date:"date",
    /**
     * 时间类型
     */
    datetime:"datetime",
    /**
     * 树列表类型
     */
    datatype:"datatype",
    /**
     * 列表类型
     */
    list:"list",
    /**
     * 字段模板
     */
    fieldtemplate:"fieldtemplate"
}
/**
 * 显示的格式样式 百分比，整形等格式
 *
 */
const CELL_STYLE = {
    /**
     * 通常格式
     */
    styleCommon: 0,
    /**
     * 通常格式局中
     */
    styleCenter: 1,
    /**
     * excel的标题
     */
    styleCaption: 2,
    /**
     * 格式'0'
     */
    style1: 3,
    /**
     * 格式'0.00'
     */
    style2: 4,
    /**
     * 格式'＃,##0'
     */
    style3: 5,
    /**
     * 格式'＃,##0.00'
     */
    style4: 6,
    /**
     * 格式'0％'
     */
    style9: 7,
    /**
     * 格式'0.00％'
     */
    style10: 8
}
/**
 * 操作Excel相关函数
 */
class excel {
    constructor() {

    }
    options = {
        //错误的文件目录
        impFailpath: path.join(process.cwd(), '/upload/ImpErr')
    }
    init (opts){
        _.assign(this.options,opts)
    }
    /**
     * mssql的类型转换为excel的类型
     * @param datatype
     */
    convertMssqlType (datatype){
        let result = DATA_TYPE.string
        switch (datatype){
            case "tinyint":
                result = DATA_TYPE.bool;
                break;
            case "char":
                result = DATA_TYPE.string;
                break;
            case "nchar":
                result = DATA_TYPE.string;
                break;
            case "varchar":
                result = DATA_TYPE.string;
                break;
            case "nvarchar":
                result = DATA_TYPE.string;
                break;
            case "text":
                result = DATA_TYPE.string;
                break;
            case "int":
                result = DATA_TYPE.number;
                break;
            case "smallint":
                result = DATA_TYPE.number;
                break;
            case "float":
                result = DATA_TYPE.number;
                break;
            case "double":
                result = DATA_TYPE.number;
                break;
            case "decimal":
                result = DATA_TYPE.number;
                break;
            case "real":
                result = DATA_TYPE.number;
                break;
            case "numeric":
                result = DATA_TYPE.number;
                break;
            case "date":
                result = DATA_TYPE.date;
                break;
            case "datetime":
                result = DATA_TYPE.datetime;
                break;
        }
        return result;
    }
    /**
     * mysql的类型转换为excel的类型
     * @param datatype
     */
    convertMysqlType (datatype){
        let result = DATA_TYPE.string
        switch (datatype){
            case "tinyint":
                result = DATA_TYPE.bool;
                break;
            case "char":
                result = DATA_TYPE.string;
                break;
            case "varchar":
                result = DATA_TYPE.string;
                break;
            case "text":
                result = DATA_TYPE.string;
                break;
            case "int":
                result = DATA_TYPE.number;
                break;
            case "smallint":
                result = DATA_TYPE.number;
                break;
            case "float":
                result = DATA_TYPE.number;
                break;
            case "double":
                result = DATA_TYPE.number;
                break;
            case "date":
                result = DATA_TYPE.date;
                break;
            case "datetime":
                result = DATA_TYPE.datetime;
                break;
        }
        return result;
    }
    /**
     * 得到导入的文件路径
     * @param filepath
     */
    getImpFilePath(filepath){
        return path.join($upload.options.uploadpath,filepath)
    }
    getImpFailpath(filepath){
        let opts = this.options
        return path.join(opts.impFailpath,filepath)
    }

    /**
     * 得到一个sheet对象
     * @param {object} colInfos message的对象信息
     * @param rows 导出的数据
     * @param {object[]} [mergeCells] 合并单元格对象[{mergeField:'',premiseField:''}]
     * @param {string} [sheetTitle] sheet标题
     * @returns {{}}
     */
    getConfigbyData (colInfos, rows, mergeCells, sheetTitle){
        let headerObj = this._convertColInfosToHeaderObj(colInfos)
        return this.getConfig(headerObj, rows, mergeCells, sheetTitle)
    }
    /**
     * 得到一个sheet对象
     * @param {object} headerObj 导出的头文件格式 [{name : key,type : item.type,title : item.title,order : item.order,templaterows : item.templaterows}, {name : key,type : item.type,title : item.title,order : item.order,templaterows : item.templaterows}]
     * @param {object[]} rows 导出的数据
     * @param {object[]} [mergeCells] 合并单元格对象[{mergeField:'',premiseField:''}]
     * @param {string} [sheetTitle] sheet标题
     * @returns {{}}
     * @example
     let headers = {};
     headers.sfzh = $message.card.columns.sfzh;
     headers.xm = $message.card.columns.xm;
     headers.xb = $message.card.columns.xb;
     let headers = [];
     headers.push({name:"sfzh",value:$message.card.columns.sfzh});
     $excel.getConfig(headers, rows, "");
     */
    getConfig (headerObj, rows, mergeCells, sheetTitle){
        //得到config对象
        function _getConf(headers){
            /**
             * 得到列对象
             * @param {string} name 字段名称
             * @param {string} title 标题名称
             * @param {string} type 属性类型
             * @param {int} [cellStyle] 显示的格式
             * @param {int} [width] 显示的格式
             * @returns {{width: number, captionStyleIndex: number, caption, beforeCellWrite: (function(*, *=, *=): number), type}}
             */
            function getCol(name, title, type, cellStyle, width) {
                //格式判断
                function format(val, opt, styleIndex) {
                    let type = opt.cellType;

                    /*function addzero(v) {
                        if (v < 10) return '0' + v;
                        return v.toString();
                    }*/
                    switch (type){
                        case DATA_TYPE.string:
                            opt.cellType = DATA_TYPE.string;
                            val = $convert.getString(val)
                            break;
                        case DATA_TYPE.date:
                            opt.cellType = DATA_TYPE.string;
                            //居中对齐
                            opt.styleIndex = CELL_STYLE.styleCenter;
                            val = $convert.getDateStr(val)
                            break;
                        case DATA_TYPE.datetime:
                            opt.cellType = DATA_TYPE.string;
                            //居中对齐
                            opt.styleIndex = CELL_STYLE.styleCenter;
                            val = $convert.getDateTimeStr(val)
                            break;
                        case DATA_TYPE.bool:
                            opt.cellType = DATA_TYPE.string;
                            //居中对齐
                            opt.styleIndex = CELL_STYLE.styleCenter;
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
                        case DATA_TYPE.number:
                            opt.styleIndex = styleIndex;
                            val = $convert.getNumber(val,null)
                            break;
                        case DATA_TYPE.json:
                            opt.styleIndex = styleIndex;
                            val = $convert.getJsonStr(val)
                            break;
                    }

                    return val;
                }
                //得到宽度
                function getColWidth(type){
                    let result = 15
                    switch (type){
                        case DATA_TYPE.string:
                            result = 15
                            break;
                        case DATA_TYPE.date:
                            result = 12
                            break;
                        case DATA_TYPE.datetime:
                            result = 23
                            break;
                    }
                    return result
                }

                let col = {
                    caption:title,
                    //字段名称
                    name:name,
                    //所有的属性类型都是string
                    type:type,
                    //width不好使
                    width:width?width:getColWidth(type),
                    /**
                     * 标题的样式索引
                     * //<cellXfs count="4">
                     //     <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
                     //     <xf numFmtId="14" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
                     //     <xf numFmtId="14" fontId="0" fillId="2" borderId="1" xfId="1" applyNumberFormat="1" applyFont="1"/>
                     //     <xf numFmtId="0" fontId="0" fillId="2" borderId="1" xfId="1" applyFont="1"/>
                     //   </cellXfs>
                     // 这个就是style.xml这个节点cellXfs中的索引号。
                     */
                    captionStyleIndex: CELL_STYLE.styleCaption,
                    //styleIndex:colStyle,
                    //日期格式要改变成string否则显示有问题
                    beforeCellWrite: function (row, cellData, eOpt) {
                        let value = format(cellData, eOpt, cellStyle);
                        return value;
                    }
                };

                return col
            }

            let conf = {};
            //可以设置样式
            conf.stylesXmlFile = path.join(__dirname,"excel_styles.xml");
            if (sheetTitle){
                conf.name = sheetTitle;
            }

            conf.cols = [];
            for (let item of headers) {
                //判断字段模板数据并且在headers上生成需要的对象
                if (item.type == DATA_TYPE.fieldtemplate) {
                    item.content = []
                    for (let i in item.templaterows) {
                        let templates = item.templaterows[i]
                        let content = $convert.getJson(templates.content);
                        item.content = item.content.concat(content)
                    }
                    item.content.forEach(function (n) {
                        let type = DATA_TYPE.string
                        switch (n.type){
                            case "booleanfield":
                                type = DATA_TYPE.bool
                                break;
                            case "numberfield":
                                type = DATA_TYPE.number
                                break;
                            case "datetimefield":
                                type = DATA_TYPE.string
                                break;
                            case "datefield":
                                type = DATA_TYPE.string
                                break;
                        }
                        let col = getCol(n.name, n.label, type)
                        conf.cols.push(col);
                    })
                } else {
                    //有的时候是number类型但是有data的数据的。需要转换为string
                    let type = item.type
                    if ($util.isNotEmpty(item.data)){
                        type = DATA_TYPE.string
                    }
                    let col = getCol(item.name, item.title, type, item.cellStyle, item.width)
                    conf.cols.push(col);
                }
            }
            return conf
        }
        //得到数据
        function _getDatas(headers,rows){
            let datas = [];
            for (let i = 0; i < rows.length; i++) {
                let data = []
                let row = rows[i]
                for (let item of headers) {
                    let val = row[item.name]
                    if (item.type == DATA_TYPE.fieldtemplate) {
                        let dataObj = $convert.getJson(val)
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
                            val = $convert.getDataTextByValue(item.data,val)
                            /*let index = _.findIndex(item.data,
                                function(o) {
                                    return $convert.getString(o.value) == $convert.getString(val);
                                }
                            )
                            if (index!=-1){
                                val = item.data[index].text
                            }*/
                        }
                        data.push($convert.getObject(val))
                    }
                }
                datas.push(data);
            }
            return datas
        }
        //通过header对象得到headers的数组
        function _getHeaders(headerObj){
            let headers = []
            for (let key in headerObj) {
                let item = headerObj[key]
                /*//不是对象继续执行
                if (!_.isObject(item)) continue*/
                let columntype = DATA_TYPE.string
                if (item.type) columntype = item.type
                let header = {
                    name: key,
                    type: columntype,
                    title: item.title,
                    /**
                     * 单元格样式
                     */
                    cellStyle: item.cellStyle,
                    order: item.order,
                    //宽度。如果没有就是系统根据类型定义
                    width: item.width,
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
                headers.push(header);
            }
            return _.orderBy(headers, ['order'], ['asc']);
        }
        let self = this;
        if ($util.isEmpty(rows)){
            throw new Error("没有查询到要导出的数据！")
        }
        let headers
        //当数组时根据数据的顺序排序
        if (_.isArray(headerObj)){
            let tempHeaderObj = {};
            let i = 0;
            for (const item of headerObj) {
                tempHeaderObj[item.name] = _.assign({},item.value,{order:i++})
            }
            headers = _getHeaders(tempHeaderObj)
        }else{
            headers = _getHeaders(headerObj)
        }

        let conf = _getConf(headers)
        conf.rows = _getDatas(headers,rows);
        conf.mergeCells = mergeCells;
        return conf
    }
    /**
     * 转换colInfos到HeaderObj
     * @param colInfos
     */
    _convertColInfosToHeaderObj (colInfos){
        let headerObj = {};
        for (let key in colInfos) {
            let item = colInfos[key]
            if ($convert.getBool(item.sfdc)) {
                headerObj[key] = item
            }
        }
        return headerObj
    }
    /**
     * 导出excel数据流
     * @param {object}  headerObj 导出的头文件格式 [{name : key, type : item.type, captionStyle:item.captionStyle, title : item.title,order : item.order,templaterows : item.templaterows}, {name : key,type : item.type,title : item.title,order : item.order,templaterows : item.templaterows}]
     * @param {object[]} rows 导出的数据
     * @param {object[]} [mergeCells] 合并单元格对象[{mergeField:'',premiseField:''}]
     * @param {string} [sheetTitle] sheet标题
     * @returns {*}
     */
    expExcelStream (headerObj, rows, mergeCells, sheetTitle) {
        let conf = this.getConfig(headerObj, rows, mergeCells, sheetTitle)
        return Buffer.from(nodeExcel.execute(conf), 'binary');
    }
    /**
     * 导出excel
     * @param ctx
     * @param {string} title 导出的文件名
     * @param {object|object[]} headerObj 导出的头文件格式对象
     * @param {object[]|object} rows 导出的数据
     * @param {object[]} [mergeCells] 合并单元格对象[{mergeField:'',premiseField:''}]
     * @param {string} [sheetTitle] sheet标题
     * @example
     let headers = {};
     headers.sfzh = $message.card.columns.sfzh;
     headers.xm = $message.card.columns.xm;
     headers.xb = $message.card.columns.xb;
     $excel.expExcel(ctx, $message.card.title, headers, rows);
     */
    expExcel (ctx, title, headerObj, rows, mergeCells, sheetTitle) {
        let excelStream = this.expExcelStream(headerObj, rows, mergeCells, sheetTitle)
        ctx.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        ctx.set("Content-Disposition", "attachment; filename=" + encodeURIComponent(title) + ".xlsx");
        ctx.body = excelStream
    }
    /**
     * 根据配置的信息表导出excel
     * @param ctx
     * @param {string} title 导出的文件名
     * @param {object} colInfos 导出的头文件格式
     * @param {object[]|object} rows 导出的数据
     * @param {object[]} [mergeCells] 合并单元格对象[{mergeField:'',premiseField:''}]
     * @param {string} [sheetTitle] sheet标题
     */
    expExcelbyData (ctx, title, colInfos, rows, mergeCells, sheetTitle) {
        let headerObj = this._convertColInfosToHeaderObj(colInfos)
        this.expExcel(ctx, title, headerObj, rows, mergeCells, sheetTitle);
    }
    /**
     * 多个sheet的导出 通过getConfig的方法得到数据。然后把数据传到这个函数进行导出
     * @param ctx
     * @param {string} title 导出的文件名
     * @param {object[]} configs getConfig的数据数组
     * @example
     let configs = []
     let config1 = $excel.getConfigbyData($message.process_request_kpi_quality,result)
     let config2 = $excel.getConfigbyData($message.process_request_kpi_quality,result)
     configs.push(config1)
     configs.push(config2)
     $excel.expExcelbyConfig(ctx,$message.process_request_kpi_quality.title,configs)
     */
    expExcelbyConfig (ctx, title, configs){
        let excelStream = Buffer.from(nodeExcel.execute(configs), 'binary');
        ctx.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        ctx.set("Content-Disposition", "attachment; filename=" + encodeURIComponent(title) + ".xlsx");
        ctx.body = excelStream
    }
    /**
     * 根据Excel模板导出excel
     * @param ctx
     * @param {string} title 导出的文件名
     * @param {string} templatePath Excel模板文件路径
     * @param {object[]||object} data 导出的数据
     * @returns {Promise<unknown>}
     */
    expExcelbyTemplate (ctx, title, templatePath, data) {
        let templateFs = $file.readFile(templatePath,'')
        return new Promise((resolve, reject) => {
            ejsexcel.renderExcelCb(templateFs, data, function (err, exlBuf) {
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
    }
    /**
     * 导入excel文件
     * @param {object} ctx
     * @param {object} opts  sql语句
     * @returns {Promise<{{fail: number, success: number, failfilename: string}}>}
     * @example
     * {
     *   fail: number, //错误的个数
     *   success: number, //成功的个数
     *   failfilename: string //错误的文件名
     * }
     */
    async impExcel (ctx, opts) {
        //文件数据转xlsx格式
        function xlsxDatatoJson(xlsData) {
            let workbook = xlsx.read(xlsData);
            let sheetNames = workbook.SheetNames; // 返回 ['sheet1', 'sheet2',……]
            let worksheet = workbook.Sheets[sheetNames[0]];// 获取excel的第一个表格
            //defval添加这个可以可以让值为空的列导出来
            //rawNumbers:false 设置为false时所有数字或者时间都返回字符串
            return xlsx.utils.sheet_to_json(worksheet,{defval:null});
        }
        //转换为导出模板的类型
        function convertType(data){
            let result = DATA_TYPE.string
            if (typeof data == "string"){
                result = DATA_TYPE.string
            }else if(typeof data == "number"){
                result = DATA_TYPE.number
            }else if (typeof data == "date"){
                result = DATA_TYPE.date
            }
            return result
        }

        /**
         * 执行sql命令
         */
        async function execSql(connection, params){
            if ($util.isEmpty(options.sqlFunction)){
                await options.sqlHelper.execSqlByConnection(connection, options.sql, params)
            }else{
                await options.sqlFunction.call(self,connection,params)
            }
        }
        let defaultOptions = {
            /**
             * 要执行的sql语句
             */
            sql:"",
            /**
             * 执行的数据库Helper.
             * @returns {mysqlhelper|mssqlhelper}
             */
            sqlHelper: null,//$mysqlhelper $mssqlhelper
            sqlFunction:null,//执行的sql的过程函数。function(connection,param)
            /**
             * 上传文件成功事件:让程序取得一些参数
             * @param ctx let bodyParam = ctx.request.body 得到相关上传的参数
             * @param uploadFilename 上传的文件名称
             * @param uploaddata 上传的文件数据。可能通过bodyParam.file得到文件名。再通过$file.writeFile(uploadFilename,uploaddata)
             * @returns {Promise<void>}
             */
            onUploadFileSuccess: async function (ctx,uploadFilename,uploaddata){

            },
            /**
             *
             * @param item 上传的数据
             * @param bodyParam post提交的参数数据
             * @returns {Promise<void>}
             */
            onSetParams:async function (item,bodyParam){

            },
            /**
             * 导入失败的文件
             * @param uploadFilename 上传的文件名。
             * @param failFilename 失败的文件名。
             * @returns {Promise<void>}
             */
            onImportFail:async function (uploadFilename, failFilename){

            }
        }
        let self = this
        let options = _.assign({},defaultOptions,opts)
        let failfilepath = this.options.impFailpath
        let uploaddata = await $upload.uploadfile(ctx,["xls","xlsx"])
        //得到上传的文件名
        let uploadFilename = ctx.request.body[$upload.options.importFilename]
        await options.onUploadFileSuccess.call(self,ctx,uploadFilename,uploaddata)
        let rows = xlsxDatatoJson(uploaddata)
        let failInfos = []
        let resultInfo = {
            success: 0,
            fail: 0,
            failfilename: $file.UUIDFileName("err.xlsx")
        }
        await options.sqlHelper.getConnection(async function(connection){
            for (let i = 0; i < rows.length; i++) {
                let item = rows[i];
                try {
                    let bodyParam = ctx.request.body
                    let params = await options.onSetParams.call(this,item,bodyParam)
                    if (!params||params.length==0) {
                        throw "callbackParam参数没有设置插入的数据！"
                    }
                    //如果返回数组代表是一下导入多条数据。
                    if (_.isArray(params[0])){
                        for (const paramElement of params) {
                            await execSql(connection, paramElement)
                        }
                    }else{
                        await execSql(connection, params)
                    }
                    resultInfo.success = resultInfo.success + 1;
                } catch (err) {
                    let info = _.assign({}, item, {"错误行号": String(i + 2), "错误内容": err.message})
                    //把导入的所有数据放到info里
                    failInfos.push(info)
                }
            }
        });

        resultInfo.fail = failInfos.length;
        //如果有错误的话。把错误信息保存到本地让客户下载
        if (resultInfo.fail > 0) {

            $file.createFolder(failfilepath)

            let headers = {};
            let failinfo = failInfos[0];
            for (let key in failinfo) {
                headers[key] = {
                    title: key,
                    type: convertType(failinfo[key])
                }
            }
            let excelStream = this.expExcelStream(headers, failInfos, null, "错误信息")
            $file.writeFile(path.join(failfilepath, resultInfo.failfilename), excelStream)
            await options.onImportFail.call(this, uploadFilename, resultInfo.failfilename)
        }
        console.log("impExcel complete!")
        return resultInfo
    }
    //==============================================================
};
module.exports = new excel()
module.exports.DATA_TYPE = DATA_TYPE