/**
 * mssql数据库相关函数
 *
 * */
const mssql = require('mssql')
const $log4js = require('./log4js')

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
    //连接池
    pool: null,
    /**
     * Create a new Pool instance.
     * @param {object|string} config Configuration or connection string for new MySQL connections
     * @return {Pool} A new MySQL pool
     * @public
     */
    createPool: async function (config,callback){
        // 使用连接池，提升性能
        if(!(this.pool && this.pool.connected)) {
            this.pool = await mssql.connect(config);
        }
        return this.pool;
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
                result += ":"+(i+1);
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
     * @returns {Promise<PreparedStatement>}
     */
    getConn: async function () {
        try{
            let ps = new mssql.PreparedStatement(this.pool);
            return ps;
        }catch(err){
            $log4js.sqlErrLogger("创建连接池", "错误", err)
            console.log(err.message)
            throw err;
        }
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
            let ps = await this.getConn();
            try {
                result = await this.execSqlByConn(ps, sql, params)
            } catch (err) {
                throw err
            } finally {
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
        let sql = "SELECT table_name tableName, ENGINE, table_comment tableComment, create_time createTime FROM information_schema.TABLES WHERE table_schema = (SELECT DATABASE())"
        return await this.execSql(sql);
    },
    /**
     * 得到某个表的所有字段名称
     * @param {string} tablename 查询的表名
     * @returns {Promise<Object>}
     */
    selectAllByTableFieldName: async function(tablename) {
        let sql = "SELECT column_name columnName,data_type dataType,column_comment columnComment,column_key columnKey,extra FROM information_schema.COLUMNS WHERE table_name = ? AND table_schema = (SELECT DATABASE()) ORDER BY ordinal_position;"
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
        sqlData = $convert.getString(sqlData)
        if (pageSize!=-1) {
            bgnID = (pageIndex - 1) * pageSize
            if ($util.isNotEmpty(sort)) {
                sqlOrder =  " " + " order by " + sort + " " + order
            }
            sql = "select count(0) as totalCount from " + tablename;
            sql += " where 1=1 " + sqlData
            //得到总数
            let row = await this.execSql(sql);
            totalCount = row[0].totalCount
        }
        sql = "select " + totalCount + " AS TOTAL,a.* FROM " + tablename
        sql += " " + "a JOIN (select " + options.id + " from " + tablename
        sql +=  " where 1=1 " + sqlData
        if (pageSize!=-1){
            sql +=  " " + sqlOrder
            sql +=  " " + "limit " + bgnID + "," + pageSize
        }
        sql +=  " " + ") b ON a." + options.id + " = b."+options.id
        if (pageSize!=-1) {
            sql += " " + sqlOrder
        }
        return await this.execSql(sql);
    },
    /**
     * 执行sql语句
     * @param {PreparedStatement} ps 连接对象
     * @param {string} sql sql语句
     * @param {object[]} params sql参数
     * @returns {Promise<unknown>}
     */
    execSqlByConn: function (ps, sql, params) {
        let sqlStr = this.getSqlStr(sql, params);
        return new Promise((resolve, reject) => {
            if (params) {
                for (let index in params) {
                    if (typeof params[index] == "number") {
                        ps.input(index, mssql.Int);
                    } else if (typeof params[index] == "string") {
                        ps.input(index, mssql.NVarChar);
                    }
                }
            }
            ps.prepare(sqlStr, function (err) {
                if (err){
                    reject(err)
                    return;
                }
                ps.execute(params, function (err, recordset) {
                    resolve(recordset)
                    ps.unprepare(function (err) {
                        if (err)
                            reject(err)
                    });
                });
            });
        })
    },
};