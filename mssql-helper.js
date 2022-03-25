/**
 * mssql数据库相关函数
 * 必须在调试里添加下面的语句--tls-min-v1.0 否则无法连接数据库
 *
 * */
const Connection = require('tedious').Connection;
const Request = require('tedious').Request;
const TYPES = require('tedious').TYPES;
const _ = require('lodash')
const $log4js = require('./log4js')
const $util = require('./util')
const $convert = require('./convert')
//参数的别名以A开头：例如@A1,@A2....
const paramname = "A"
module.exports = {
    /**
     * resultSet记录集对象转换成json数组格式
     * @param resultSet
     * @private
     */
    _resultSetToJson: async function (resultSet){
        let result = [];
        //得到字符的名称
        let fieldnames = resultSet.metaData
        //let rows = await resultSet.getRows()
        let row;
        //把数据返回到一个数组中。
        while (row = await resultSet.getRow()) {
            let resultRow = {}
            for (let i = 0; i < fieldnames.length; i++) {
                resultRow[fieldnames[i].name.toLowerCase()] = row[i]
            }
            result.push(resultRow)
        }
        return result;
    },
    //连接
    connection: null,

    /**
     * Create a new Pool instance.
     * @param {object|string} config Configuration or connection string for new MySQL connections
     * @return {Pool} A new MySQL pool
     * @public
     */
    createPool: async function (config){
        //let self = this;
        // 使用连接池，提升性能
        if(!(this.connection && !this.connection.closed && this.connection.state.name!="Final")) {
            if (!config&&this.connection) {
                config = this.connection.config
            }
            this.connection = new Connection(config);
            this.connection.connect(function(err) {
                if (err) {
                    $log4js.sqlErrLogger("创建连接", "错误", err)
                    console.log(err.message)
                }else{
                    console.log("mssql连接成功！")
                }
            });
        }
        return this.connection
    },
    /**
     * 拼写sql存储过程语句
     * @param {string} sql sql语句
     * @param {object[]} params 参数数组
     * @returns {*}
     */
    getSqlStr: function (sql, params) {
        let result = "";
        if (sql.indexOf("call ") != -1) {
            result = sql.replace(")", "");
            let b = (sql.length - sql.indexOf("(")) > 2;
            for (let i = 0; i < params.length; i++) {
                if (b) {
                    result += ",";
                }
                result += "@" + paramname + (i+1);
                b = true;
            }
            result += ")";
        } else {
            result = sql;
        }
        return result;
    },
    /**
     * 得到getConnection
     * @returns {Promise<Connection>}
     */
    getConn: function () {
        return this.connection
    },
    /**
     * 执行sql语句
     * @param {string} sql sql语句
     * @param {object[]} params sql参数
     * @returns {Promise<number>}
     */
    execSql: async function (sql, params) {
        let result = 0
        params = params || []
        try {
            let connection = this.getConn();
            try {
                result = await this.execSqlByConn(connection, sql, params)
            } catch (err) {
                throw err
            } finally {
                //connection.close();
            }
        } catch (err) {
            throw err
        }
        return result;


    },
    /**
     * 执行带事务的sql语句
     * @param {string} poolAlias 连接池对象
     * @param {string} sql sql语句
     * @param {object[]} param sql参数
     * @param pool
     * @returns {Promise<number>}
     */
    execSqlByTransaction: async function (sql, param) {
        let result = 0
        try {
            const transaction = new mssql.Transaction(this.pool)
            transaction.begin(err => {
                // ... error checks

                let rolledBack = false

                transaction.on('rollback', aborted => {
                    // emited with aborted === true

                    rolledBack = true
                })

                new mssql.Request(transaction)
                    .query('insert into mytable (bitcolumn) values (2)', (err, result) => {
                        // insert should fail because of invalid value

                        if (err) {
                            if (!rolledBack) {
                                transaction.rollback(err => {
                                    // ... error checks
                                })
                            }
                        } else {
                            transaction.commit(err => {
                                // ... error checks
                            })
                        }
                    })
            })
        } catch (err) {
            throw err
        }
        return result;
    },
    /**
     * 得到所有表数据
     * @returns {Promise<object>}
     */
    selectAllByTableName: async function(){
        let sql = `select a.name tableName, b.value tableComment 
        from sysobjects a 
        LEFT JOIN sys.extended_properties b ON a.id = b.major_id 
        AND b.minor_id = 0 where xtype = 'u'`
        return await this.execSql(sql);
    },
    /**
     * 得到某个表的所有字段名称
     * @param {string} tablename 查询的表名
     * @returns {Promise<Object>}
     */
    selectAllByTableFieldName: async function(tablename) {
        let sql = `SELECT col.colorder AS id,
            col.name AS columnName,
            ISNULL( ep.[value], '' ) AS columnComment,
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
            '√' ELSE ''
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
    },
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
    selectAllByTablePage: async function(tablename, pageIndex, pageSize, order, sort, sqlData, options) {
        options = _.assign({},{id:"pkid"}, options)
        let sqlOrder = ""
        let sql = ""
        let totalCount = 0
        let bgnID = 1
        let endID = 20
        sqlData = $convert.getString(sqlData)
        if (pageSize!=-1) {
            bgnID = (pageIndex - 1) * pageSize
            endID = pageIndex * pageSize
            if (!$util.isNotEmpty(sort)) {
                //当没有排序时需要定义一个排序的列，就把主键定义为排序的列
                sort = options.id
                order = ASC
            }
            sql = `select count(0) as totalCount from ${tablename} where 1=1 ${sqlData}`;
            //得到总数
            let row = await this.execSql(sql);
            totalCount = row[0].totalCount
            sql = `select ${totalCount} AS TOTAL,a.* FROM 
            (select ROW_NUMBER() over (order by ${sort} ${order}) orderid,* from ${tablename} where 1=1 ${sqlData}) a
            where (a.orderid between ${bgnID} and ${endID})`
        }else{
            sql = `select 0 AS TOTAL,a.* FROM 
            (select * from ${tablename} where 1=1 ${sqlData}) a`
        }
        return await this.execSql(sql);
    },
    /**
     * 执行sql语句
     * @param {Connection} connection 连接对象
     * @param {string} sql sql语句
     * @param {object[]} params sql参数
     * @returns {Promise<unknown>}
     */
    execSqlByConn: function (connection, sql, params) {
        let sqlStr = this.getSqlStr(sql, params);
        return new Promise((resolve, reject) => {
            // Print the rows read
            let result = 0;
            // Read all rows from table
            let request = new Request(
                sqlStr,
                function(err, rowCount) {
                    if (err) {
                        reject(err)
                    } else {
                        //删除时可以知识处理了多少数据
                        if (result==0){
                            result = rowCount
                        }
                        resolve(result)
                    }
                });
            if (params) {
                for (let i = 0; i < params.length; i++) {
                    if (typeof params[i] == "number") {
                        request.addParameter(paramname+(i+1), TYPES.Numeric, params[i]);
                    } else if (typeof params[i] == "string") {
                        request.addParameter(paramname+(i+1), TYPES.NVarChar, params[i]);
                    }
                }
            }
            request.on('row', function(columns) {
                //当是返回的集合时设置为数组
                if (result==0){
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
            connection.execSql(request);
        })
    },
};