/**
 * mssql数据库相关函数
 * 必须在调试里添加下面的语句--tls-min-v1.0 否则无法连接数据库
 *
 * */
const {Connection,Request,TYPES} = require('tedious');
const _ = require('lodash')
const $log4js = require('./log4js')
const $util = require('./util')
const $convert = require('./convert')
//参数的别名以A开头：例如@A1,@A2....
const paramname = "A"

/**
 * mssql数据库相关函数
 * 必须在调试里添加下面的语句--tls-min-v1.0 否则无法连接数据库
 */
class mssqlhelper {
    constructor() {

    }
    //连接
    //connection: null,
    _config=null
    /**
     * 创建一个连接池
     * @param {object} config 连接的配置对象
     * @return {Pool} A new MySQL pool
     */
    async createPool (config){
        this._config = config
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
                sql = _.replace(sql,"?","@" + paramname + i++)
            }
        }
        return sql
    }
    /**
     * 得到getConnection
     * @returns {Promise<Connection>}
     */
    _getConnection() {
        return new Promise((resolve, reject) => {
            let connection = new Connection(this._config);
            connection.connect(function (err) {
                if (err) {
                    $log4js.sqlErrLogger("创建连接", "错误", err)
                    console.log(err.message)
                    reject(err)
                } else {
                    resolve(connection)
                }
            });
        })
    }
    /**
     * 根据类型设置存储过程参数
     * @param {object[]} params sql参数数组
     */
    _setParams (request, params){
        for (let i = 0; i < params.length; i++) {
            switch (typeof params[i]) {
                case "number":
                    let options = {}
                    //让数据为小数。
                    if (!_.isInteger(params[i])){
                        options = {
                            scale:2
                        }
                    }
                    request.addParameter(paramname+(i+1), TYPES.Numeric, params[i],options);
                    break;
                case "string":
                    request.addParameter(paramname+(i+1), TYPES.NVarChar, params[i]);
                    break;
                case "boolean":
                    break;
                default:
                    request.addParameter(paramname+(i+1), TYPES.NVarChar, params[i]);
                    break;
            }
        }
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
        let result = 0
        params = params || []
        await this.getConnection(async function (connection){
            result = await self.execSqlByConnection(connection, sql, params)
        })
        return result;
    }
    async getConnection(fn){
        let connection = await this._getConnection();
        try {
            if (fn){
                await fn(connection)
            }
        } catch (err) {
            throw err
        } finally {
            connection.close();
        }
    }
    /**
     * 执行事务sql语句
     * @param {string} sql sql语句
     * @param {object[]} params sql参数
     * @returns {Promise<object[]>}
     */
    async execTransactionSql(sql, params=[]) {
        let result = 0
        params = params || []
        try {
            let connection = await this._getConnection();
            try {
                result = await this.execSqlTransactionByConn(connection, sql, params)
            } catch (err) {
                throw err
            } finally {
                connection.close();
            }
        } catch (err) {
            throw err
        }
        return result;
    }
    /**
     * 执行存储过程
     * @param {string} sql sql语句
     * @param {object[]} param sql参数
     * @returns {Promise<number>}
     */
    async execProcedure (sql, params) {
        let result = 0
        params = params || []
        try {
            let connection = await this._getConnection();
            try {
                result = await this.execProcedureByConn(connection, sql, params)
            } catch (err) {
                throw err
            } finally {
                connection.close();
            }
        } catch (err) {
            throw err
        }
        return result;
    }
    /**
     * 执行带事务的sql语句
     * @param {Connection} connection 连接对象
     * @param {string} sql sql语句
     * @param {object[]} params sql参数
     * @returns {Promise<object>}
     */
    async execSqlTransactionByConn (connection, sql, params) {
        /**
         * 提交事务
         * @private
         */
        function commitTransaction() {
            connection.commitTransaction((err) => {
                if (err) {
                    console.log('commit transaction err: ', err);
                }
                //console.log('commitTransaction() done!');
                //console.log('DONE!');
                connection.close();
            });
        }
        /**
         * 回滚事务
         * @param err
         * @private
         */
        function rollbackTransaction(err) {
            console.log('transaction err: ', err);
            connection.rollbackTransaction((err) => {
                if (err) {
                    console.log('transaction rollback error: ', err);
                }
            });
            connection.close();
        }
        /**
         * 开始事务
         * @private
         */
        function beginTransaction() {
            connection.beginTransaction((err) => {
                if (err) {
                    // If error in begin transaction, roll back!
                    rollbackTransaction(err);
                } else {
                    //console.log('beginTransaction() done');
                    // If no error, commit transaction!
                    commitTransaction();
                }
            });
        }

        const start = new Date()
        let self = this;
        return new Promise((resolve, reject) => {
            // Print the rows read
            let result = [];
            sql = self.getSqlStr(sql)
            // Read all rows from table
            let request = new Request(sql, function(err, rowCount) {
                const ms = new Date() - start
                if (err) {
                    $log4js.sqlErrLogger(sql, params, err, ms)
                    reject(err)
                    return;
                }
                //删除时可以知识处理了多少数据
                if (result.length==0&&rowCount!=0){
                    result = rowCount
                }
                $log4js.sqlInfoLogger(sql, params, ms)
                beginTransaction()
                resolve(result)
            });
            if (params) {
                self._setParams(request, params)
            }
            //connection.callProcedure()
            // Execute SQL statement
            connection.execSql(request);
        })
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
        }
        return await this.execSql(sql);
    }
    /**
     * 执行sql语句
     * @param {Connection} connection 连接对象
     * @param {string} sql sql语句
     * @param {object[]} params sql参数
     * @returns {Promise<object>}
     */
    execSqlByConnection (connection, sql, params) {
        const start = new Date()
        let self = this
        return new Promise((resolve, reject) => {
            // Print the rows read
            let result = [];
            sql = self.getSqlStr(sql)
            // Read all rows from table
            let request = new Request(sql, function(err, rowCount) {
                const ms = new Date() - start
                if (err) {
                    $log4js.sqlErrLogger(sql, params, err, ms)
                    reject(err)
                    return;
                }
                //删除时可以知识处理了多少数据
                if (result.length==0&&rowCount!=0){
                    result = rowCount
                }
                $log4js.sqlInfoLogger(sql, params, ms)
                resolve(result)
            });
            if (params) {
                self._setParams(request, params)
            }
            request.on('row', function(columns) {
                //当是返回的集合时设置为数组
                /*if (result==null){
                    result = []
                }*/
                let row = {};
                columns.forEach(function(column)
                {
                    row[column.metadata.colName] = column.value;
                });
                result.push(row);
            });
            //connection.callProcedure()
            // Execute SQL statement
            connection.execSql(request);
        })
    }
    //执行存储过程的相关函数=========================================================
    /**
     * 执行sql语句
     * @param {Connection} connection 连接对象
     * @param {string} ProcedureName sql语句
     * @param {object[]} params sql参数
     * @returns {Promise<object>}
     */
    async execProcedureByConn (connection, ProcedureName, params) {
        /**
         * 得到存储过程参数名称
         * @param {Connection} connection 连接对象
         * @param {string} ProcedureName
         * @returns {object}
         * @private
         */
        async function _getProcedureParameters(connection, ProcedureName){
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
            return await self.execSqlByConnection(connection,sql,[ProcedureName])
        }
        /**
         * 得到参数的实际类型
         * @param {string} parametersType
         * @returns {Promise<object>}
         * @private
         */
        function _getParametersType(parametersType){
            let result = TYPES.NVarChar
            switch (parametersType) {
                case 'tinyint':
                    result = TYPES.TinyInt
                    break;
                case 'bit':
                    result = TYPES.Bit
                    break;
                case 'smallint':
                    result = TYPES.SmallInt
                    break;
                case 'int':
                    result = TYPES.Int
                    break;
                case 'smalldatetime':
                    result = TYPES.SmallDateTime
                    break;
                case 'real':
                    result = TYPES.Real
                    break;
                case 'money':
                    result = TYPES.Money
                    break;
                case 'datetime':
                    result = TYPES.DateTime
                    break;
                case 'float':
                    result = TYPES.Float
                    break;
                case 'decimal':
                    result = TYPES.Decimal
                    break;
                case 'numeric':
                    result = TYPES.Numeric
                    break;
                case 'smallmoney':
                    result = TYPES.SmallMoney
                    break;
                case 'bigint':
                    result = TYPES.BigInt
                    break;
                case 'image':
                    result = TYPES.Image
                    break;
                case 'text':
                    result = TYPES.Text
                    break;
                case 'uniqueIdentifier':
                    result = TYPES.UniqueIdentifier
                    break;
                case 'ntext':
                    result = TYPES.NText
                    break;
                case 'varbinary':
                    result = TYPES.VarBinary
                    break;
                case 'varchar':
                    result = TYPES.VarChar
                    break;
                case 'binary':
                    result = TYPES.Binary
                    break;
                case 'char':
                    result = TYPES.Char
                    break;
                case 'nvarchar':
                    result = TYPES.NVarChar
                    break;
                case 'nchar':
                    result = TYPES.NChar
                    break;
                case 'xml':
                    result = TYPES.Xml
                    break;
                case 'time':
                    result = TYPES.Time
                    break;
                case 'date':
                    result = TYPES.Date
                    break;
                case 'datetime2':
                    result = TYPES.DateTime2
                    break;
                case 'datetimeoffset':
                    result = TYPES.DateTimeOffset
                    break;
                case 'udt':
                    result = TYPES.UDT
                    break;
                case 'tvp':
                    result = TYPES.TVP
                    break;
                case 'variant':
                    result = TYPES.Variant
                    break;
            }
            return result
        }
        let self = this
        const start = new Date()
        let rsParams = await _getProcedureParameters(connection,ProcedureName)
        return new Promise((resolve, reject) => {
            // Print the rows read
            let result = null;
            // Read all rows from table
            let request = new Request(ProcedureName,function(err, rowCount) {
                const ms = new Date() - start
                if (err) {
                    $log4js.sqlErrLogger(ProcedureName, params, err, ms)
                    reject(err)
                    return;
                }
                //删除时可以知识处理了多少数据
                if (result==null&&rowCount!=0){
                    result = rowCount
                }
                $log4js.sqlInfoLogger(ProcedureName, params, ms)
                resolve(result)
            });
            if ($util.isNotEmpty(rsParams)) {
                if ($util.isEmpty(params) || rsParams.length!=params.length){
                    reject("存储过程：" + ProcedureName + "传入的参数与实际参数个数不符！")
                    return;
                }
                for (let i = 0; i < rsParams.length; i++) {
                    let param = params[i]
                    let rsparam = rsParams[i]
                    let paramType = _getParametersType(rsparam.DataType)
                    request.addParameter(rsparam.ParamName.replace("@",""), paramType, param);
                }
            }
            request.on('returnValue', (paramName, value, metadata) => {

            });
            request.on('row', function(columns) {
                //当是返回的集合时设置为数组
                if (result==null){
                    result = []
                }
                let row = {};
                columns.forEach(function(column)
                {
                    row[column.metadata.colName] = column.value;
                });
                result.push(row);
            });
            //connection.callProcedure()
            // Execute SQL statement
            connection.callProcedure(request);
        })
    }
};

module.exports = new mssqlhelper()
module.exports.mssqlhelper = mssqlhelper