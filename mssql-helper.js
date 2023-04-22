/**
 * mssql数据库相关函数
 * 必须在调试里添加下面的语句--tls-min-v1.0 否则无法连接数据库
 *
 * */

const mssql = require('mssql');
const _ = require('lodash')
const $log4js = require('./log4js')
const $util = require('./util')
const $convert = require('./convert')
const $sqlHelper = require('./sql-helper')
//参数的别名以A开头：例如@A1,@A2....
const PARAMNAME = "A"

/**
 * mssql数据库相关函数
 * 必须在调试里添加下面的语句--tls-min-v1.0 否则无法连接数据库
 */
class mssqlhelper extends $sqlHelper  {
    constructor() {
        super($sqlHelper.SQL_TYPE.MSSQL);
    }
    /**
     * 创建一个连接池
     * @param {object} config 连接的配置对象
     * @return {Pool} A new MySQL pool
     */
    async createPool (config){
        this.pool = new mssql.ConnectionPool(config)

        this.pool.on('error', err => {
            $log4js.sqlErrLogger("创建连接", "错误", err)
        })
        console.log("开始创建连接池mssql！")
    }
    /**
     * 得到sql语句
     * @param {string} sql sql语句
     * @returns {string}
     */
    getSqlStr (sql) {
        let i = 1
        let index = 0
        while (index!=-1) {
            index = sql.indexOf("?")
            if (index!=-1){
                sql = _.replace(sql,"?","@" + PARAMNAME + i++)
            }
        }
        return sql
    }

    /**
     * 根据类型设置存储过程参数
     * @param {Request} request Request
     * @param {object[]} params sql参数数组
     */
    _setParams (request, params){
        for (let i = 0; i < params.length; i++) {
            let param_name = PARAMNAME+(i+1)
            let value = params[i]
            switch (typeof value) {
                case "number":
                    let options = mssql.TYPES.Numeric()
                    //让数据为小数。
                    if (!_.isInteger(value)){
                        options.scale = 2
                    }
                    request.input(param_name, options, value);
                    break;
                case "string":
                    request.input(param_name, mssql.TYPES.NVarChar, value);
                    break;
                case "boolean":
                    break;
                default:
                    request.input(param_name, mssql.TYPES.NVarChar, value);
                    break;
            }
        }
    }
    /**
     * 得到存储过程参数名称
     * @param {Connection} connection 连接对象
     * @param {string} ProcedureName
     * @returns {object}
     * @private
     */
    async _getProcedureParameters(ProcedureName){
        let sql = `SELECT sp.object_id AS FunctionId,
            sp.name AS FunctionName,
            ( CASE WHEN param.is_output = 1 THEN 'OUTPUT' ELSE 'IN' END ) AS ParamType,
            ISNULL( param.name, '' ) AS ParamName,
            ISNULL( usrt.name, '' ) AS [DataType],
            ISNULL( baset.name, '' ) AS [SystemType],
            CAST (
                CASE
                    WHEN baset.name IS NULL THEN
                    0
                    WHEN baset.name IN ( 'nchar', 'nvarchar' ) AND param.max_length <> - 1 THEN
                    param.max_length / 2 ELSE param.max_length
                    END AS INT
                ) AS [Length],
            ISNULL( parameter_id, 0 ) AS SortId,
            '' AS ParamReamrk
            FROM
            sys.objects AS sp
            INNER JOIN sys.schemas b ON sp.schema_id = b.schema_id
            LEFT OUTER JOIN sys.all_parameters AS param ON param.object_id = sp.object_id
            LEFT OUTER JOIN sys.types AS usrt ON usrt.user_type_id = param.user_type_id
            LEFT OUTER JOIN sys.types AS baset ON ( baset.user_type_id = param.system_type_id AND baset.user_type_id = baset.system_type_id )
            OR (
                ( baset.system_type_id = param.system_type_id )
                AND ( baset.user_type_id = param.user_type_id )
                AND ( baset.is_user_defined = 0 )
                AND ( baset.is_assembly_type = 1 )
            )
            LEFT OUTER JOIN sys.extended_properties E ON sp.object_id = E.major_id
            WHERE sp.object_id = OBJECT_ID( @A1)
            AND sp.type IN ( 'FN', 'IF', 'TF', 'P' )
            AND ISNULL( sp.is_ms_shipped, 0 ) = 0
            AND ISNULL( E.name, '' ) <> 'microsoft_database_tools_support'
            ORDER BY sp.name , param.parameter_id ASC;`
        return await this.execSql(sql,[ProcedureName])
    }
    /**
     * 得到参数的实际类型
     * @param {string} parametersType
     * @returns {Promise<object>}
     * @private
     */
    _getParametersType(parametersType){
        let result = mssql.TYPES.NVarChar
        switch (parametersType) {
            case 'tinyint':
                result = mssql.TYPES.TinyInt
                break;
            case 'bit':
                result = mssql.TYPES.Bit
                break;
            case 'smallint':
                result = mssql.TYPES.SmallInt
                break;
            case 'int':
                result = mssql.TYPES.Int
                break;
            case 'smalldatetime':
                result = mssql.TYPES.SmallDateTime
                break;
            case 'real':
                result = mssql.TYPES.Real
                break;
            case 'money':
                result = mssql.TYPES.Money
                break;
            case 'datetime':
                result = mssql.TYPES.DateTime
                break;
            case 'float':
                result = mssql.TYPES.Float
                break;
            case 'decimal':
                result = mssql.TYPES.Decimal
                break;
            case 'numeric':
                result = mssql.TYPES.Numeric
                break;
            case 'smallmoney':
                result = mssql.TYPES.SmallMoney
                break;
            case 'bigint':
                result = mssql.TYPES.BigInt
                break;
            case 'image':
                result = mssql.TYPES.Image
                break;
            case 'text':
                result = mssql.TYPES.Text
                break;
            case 'uniqueIdentifier':
                result = mssql.TYPES.UniqueIdentifier
                break;
            case 'ntext':
                result = mssql.TYPES.NText
                break;
            case 'varbinary':
                result = mssql.TYPES.VarBinary
                break;
            case 'varchar':
                result = mssql.TYPES.VarChar
                break;
            case 'binary':
                result = mssql.TYPES.Binary
                break;
            case 'char':
                result = mssql.TYPES.Char
                break;
            case 'nvarchar':
                result = mssql.TYPES.NVarChar
                break;
            case 'nchar':
                result = mssql.TYPES.NChar
                break;
            case 'xml':
                result = mssql.TYPES.Xml
                break;
            case 'time':
                result = mssql.TYPES.Time
                break;
            case 'date':
                result = mssql.TYPES.Date
                break;
            case 'datetime2':
                result = mssql.TYPES.DateTime2
                break;
            case 'datetimeoffset':
                result = mssql.TYPES.DateTimeOffset
                break;
            case 'udt':
                result = mssql.TYPES.UDT
                break;
            case 'tvp':
                result = mssql.TYPES.TVP
                break;
            case 'variant':
                result = mssql.TYPES.Variant
                break;
        }
        return result
    }

    /**
     * 得到getConnection
     * @returns {Promise<Connection>}
     */
    async _getConnection() {
        let self = this;
        return await self.pool.connect()
    }
    /**
     * 执行sql语句
     * @param {string} sql sql语句
     * @param {object[]} params sql参数
     * @returns {Promise<object[]>}
     * @example
     * await mssqlhelper.execSql("",[param.id])
     */
    async execSql (sql, params= []) {
        let self = this
        let result = {}
        params = params || []
        await this.getConnection(async function (connection){
            result = await self.execSqlByConnection(connection, sql, params)
        })
        return result;
    }
    //==========================================================================
    /**
     * 执行事务sql语句
     * @param {string} sql sql语句
     * @param {object[]} params sql参数
     * @returns {Promise<object[]|boolean>}
     */
    async execTransactionSql(sql, params=[]) {
        let result = true
        let self = this
        let data = undefined
        await self.getTransaction(async function (transaction){
            data = await self.execSqlByTransaction(transaction, sql, params)
        })
        //有的时候需要返回数据
        if (_.isArray(data)){
            return data
        }
        return result;
    }
    /**
     * 执行事务的函数
     * @param {function} fn 返回的函数
     * @returns {Promise<void>}
     * @example
     * await $mysqlhelper.getConnectionByTransaction(async function(connection){
            let userPkids = JSON.parse(param.userpkids);
            for (const userPkid of userPkids) {
                await $mysqlhelper.execSqlByConnection(connection, "call sp_sysuserrole_add()", [userPkid, param.cd_sysrole_pkid])
            }
        })
     */
    async getTransaction (fn) {
        let self = this
        let connection = await self._getConnection()
        const transaction = new mssql.Transaction(connection)
        try {
            await transaction.begin()
            if (fn){
                await fn(transaction)
            }
            await transaction.commit()
        } catch (err) {
            await transaction.rollback()
            throw err
        }
    }
    /**
     * 执行带事务的sql语句
     * @param {Transaction} transaction 连接对象
     * @param {string} sql sql语句
     * @param {object[]} params sql参数
     * @returns {Promise<object>}
     */
    async execSqlByTransaction (transaction, sql, params) {
        try {
            let self = this
            const start = new Date()
            let ms = 0
            sql = self.getSqlStr(sql)
            const request = new mssql.Request(transaction)
            if (params) {
                self._setParams(request, params)
            }
            let result = await request.query(sql);
            ms = new Date() - start
            $log4js.sqlInfoLogger(sql, params, ms)
            return result
        } catch (err) {
            $log4js.sqlErrLogger(sql, params, err)
            throw err
        }
    }
    //==========================================================================
    async getConnection (fn) {
        let connection = await this._getConnection();
        try {
            if (fn){
                await fn(connection)
            }
        } catch (err) {
            throw err
        } finally {
        }
    }
    /**
     * 执行sql语句
     * @param {Connection} connection 连接对象
     * @param {string} sql sql语句
     * @param {object[]} params sql参数
     * @returns {Promise<unknown>}
     */
    async execSqlByConnection (connection, sql, params) {
        let self = this
        const start = new Date()
        let ms = 0
        let result = {}
        try {
            sql = self.getSqlStr(sql)
            let request = new mssql.Request(connection)
            request.multiple = true
            if (params) {
                self._setParams(request, params)
            }
            result = await request.query(sql);
            ms = new Date() - start
            $log4js.sqlInfoLogger(sql, params, ms)
        } catch (err) {
            $log4js.sqlErrLogger(sql, params, err, ms)
            throw err
        }
        return result.recordset;
    }
    /**
     * 执行存储过程
     * @param {string} sql sql语句
     * @param {object[]} param sql参数
     * @returns {Promise<number>}
     * @example
     *  execProcedure("sp_GJ_PersonInfos_upd",[])
     */
    async execProcedure (procedureName, params) {
        let result = 0
        let self = this
        params = params || []
        try {
            let rsParams = await this._getProcedureParameters(procedureName)
            let connection = await self._getConnection()
            let request = new mssql.Request(connection)
            if ($util.isNotEmpty(rsParams)) {
                //输入的参数个数
                let paramInputlength = 0
                for (let i = 0; i < rsParams.length; i++) {
                    let rsparam = rsParams[i]
					//当没有参数时也返回一条数据。根据ParamName是否存在来判断
                    if ($util.isEmpty(rsparam.ParamName)) break;
                    let param = params[i]
                    let paramType = this._getParametersType(rsparam.DataType)
                    let paramName = rsparam.ParamName.replace("@","")
                    if (rsparam.ParamType == "IN"){
                        paramInputlength++
                        request.input(paramName, paramType, param);
                    }else{
                        request.output(paramName, paramType);
                    }
                }
                if ($util.isEmpty(params) || paramInputlength!=params.length){
                    throw new Error("存储过程：" + procedureName + "传入的参数与实际参数个数不符！")
                    return null;
                }
            }

            result = await request.execute(procedureName)
        } catch (err) {
            throw err
        }
        return result;
    }

    /**
     * 得到所有表数据
     * @returns {Promise<object>}
     */
    async selectAllByTableName(){
        let sql = `select a.name tablename, a.name tablecomment 
        from sysobjects a 
            LEFT JOIN sys.extended_properties b ON a.id = b.major_id 
            AND b.minor_id = 0 
        where a.xtype in ('U','V') 
        order by a.xtype,a.name`
        return await this.execSql(sql);
    }
    /**
     * 得到某个表的所有字段名称
     * @param {string} tablename 查询的表名
     * @returns {Promise<Object>}
     */
    async selectAllByTableFieldName (tablename) {
        let sql = `SELECT col.colorder AS id,
            col.name AS columnName,
            ISNULL( ep.[value], col.name ) AS columnComment,
            t.name AS dataType,
            col.length AS dataLength,
            CASE WHEN EXISTS (
                SELECT 1 FROM dbo.sysindexes si
                    INNER JOIN dbo.sysindexkeys sik ON si.id = sik.id
                        AND si.indid = sik.indid
                    INNER JOIN dbo.syscolumns sc ON sc.id = sik.id
                        AND sc.colid = sik.colid
                    INNER JOIN dbo.sysobjects so ON so.name = si.name
                        AND so.xtype = 'PK'
                WHERE sc.id = col.id
                AND sc.colid = col.colid
            ) THEN
            'Y' ELSE 'N'
            END AS columnKey
        FROM dbo.syscolumns col
        LEFT JOIN dbo.systypes t ON col.xtype = t.xusertype
        INNER JOIN dbo.sysobjects obj ON col.id = obj.id
            AND obj.xtype in ('U','V')
            AND obj.status >= 0
        LEFT JOIN sys.extended_properties ep ON col.id = ep.major_id
            AND col.colid = ep.minor_id
            AND ep.name = 'MS_Description'
        WHERE obj.name = @A1
        ORDER BY col.colorder;`
        return await this.execSql(sql,[tablename]);
    }
    /**
     * 分页查询表的信息
     * @param {string} tablename 查询的表名
     * @param {number} pageIndex 当前页
     * @param {number} pageSize 每页个数
     * @param {string} sqlData 查询的条件
     * @param {string} order 排序的类型
     * @param {string} sort 排序的字段
     * @param {object} options 选项
     * @returns {Promise<Object>}
     */
    async selectAllByTablePage (tablename, pageIndex, pageSize, order, sort, sqlData, options={}) {
        //得到排序的字段。因为order有可能是“asc,asc”这样的数组。所以需要判断一下排序
        function getSort(sort,order){
            let result = []
            
            if ($util.isEmpty(order)){
                order = "ASC"
            }
            if ($util.isEmpty(sort)) {
                //当没有排序时需要定义一个排序的列，就把主键定义为排序的列
                return `${options.id} ${order}`
            }
            let arrOrder = order.split(",")
            let arrSort = sort.split(",")
            for (let i = 0; i < arrSort.length; i++) {
                let itemSort = arrSort[i]
                let itemOrder = "ASC"
                if (arrOrder.length>i){
                    itemOrder = arrOrder[i]
                }
                //没有空格就代表没有排序
                if (itemSort.indexOf(" ")==-1){
                    result.push(`${itemSort} ${itemOrder}`)
                }else{
                    result.push(itemSort)
                }
            }

            return result.join(",")
        }
        options = _.assign({},{id:"pkid"}, options)
        //let sqlOrder = ""
        let sql = ""
        let totalCount = 0
        let bgnID = 1
        let endID = 20
        sqlData = $convert.getString(sqlData)
        //当不分页时pageSize为空。所以默认值为-1
        pageSize = $convert.getNumber(pageSize,-1)
        if (pageSize!=-1) {
            bgnID = (pageIndex - 1) * pageSize + 1
            endID = pageIndex * pageSize
            sort = getSort(sort,order)
            sql = `select count(0) as totalCount from ${tablename} where 1=1 ${sqlData}`;
            //得到总数
            let row = await this.execSql(sql);
            totalCount = row[0].totalCount
            sql = `select ${totalCount} AS TOTAL,a.* FROM 
            (select ROW_NUMBER() over (order by ${sort}) orderid,* from ${tablename} where 1=1 ${sqlData}) a
            where (a.orderid between ${bgnID} and ${endID})`
        }else{
            sql = `select 0 AS TOTAL,a.* FROM 
            (select * from ${tablename} where 1=1 ${sqlData}) a`
            if ($util.isNotEmpty(sort)){
                sort = getSort(sort,order)
                sql += ` order by ${sort}`
            }
        }
        return await this.execSql(sql);
    }

    //执行存储过程的相关函数=========================================================

};

module.exports = new mssqlhelper()
module.exports.mssqlhelper = mssqlhelper