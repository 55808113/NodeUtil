/**
 * oracle数据库相关函数
 *
 * */
const oracle = require('oracledb')
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
    /**
     * Create a new Pool instance.
     * @param {object|string} config Configuration or connection string for new MySQL connections
     * @return {Pool} A new MySQL pool
     * @public
     */
    createPool: function (config,callback){
        // 使用连接池，提升性能
        oracle.createPool(config, function(err, pool) {
            if (err) {
                console.log(err.message)
                console.log("Failed to create oracle db pool..." + pool.poolAlias);
                if (callback)
                    callback(err);
            } else {
                console.log("create oracle db pool..." + pool.poolAlias);
                if (callback)
                    callback();
            }
        });
        /*await oracle.createPool(config)*/
    },
    /**
     * 拼写sql存储过程语句
     * @param {string} sql sql语句
     * @param {object[]} param 参数数组
     * @returns {*}
     */
    getSqlStr: function (sql, param) {
        let result = "";
        if (sql.indexOf("call ") != -1) {
            result = sql.replace(")", "");
            let b = (sql.length - sql.indexOf("(")) > 2;
            for (let i = 0; i < param.length; i++) {
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
     * @param {string} poolAlias 连接池别名
     * @returns {Promise<unknown>}
     */
    getConn: async function (poolAlias) {
        try{
            let connection
            if (poolAlias)
                connection =  await oracle.getConnection(poolAlias);
            else
                connection =  await oracle.getConnection();
            return connection;
        }catch(err){
            $log4js.sqlErrLogger("创建连接池", "错误", err)
            console.log(err.message)
            throw err;
        }
    },
    /**
     * 存储过程查询需要的
     * @param poolAlias
     * @param sql
     * @param param
     * @returns {Promise<*[]>}
     */
    querySqlPool: async function (poolAlias, sql, param) {
        let result = [];
        try {
            let connection = await this.getConn(poolAlias);
            try {
                //第一个参数是游标参数需要设置一下
                param.splice(0,0,{ type: oracle.CURSOR, dir: oracle.BIND_OUT  });
                let data = await this.execSqlByConn(connection, sql, param)
                //得到游标返回的记录集
                const resultSet = data.outBinds[0];
                //得到字符的名称
                result = await this._resultSetToJson(resultSet)
                await resultSet.close();

                //把数据返回到一个数组中。
                /*while (row = await resultSet.getRow()) {
                    let resultRow = []
                    for (let i = 0; i < fieldnames.length; i++) {
                        let obj = {}
                        obj[fieldnames[i].name.toLowerCase()] = row[i]
                        resultRow.push(obj)
                    }
                    result.push(resultRow)
                }*/
                //关闭记住集
                  // always close the ResultSet
            } catch (err) {
                throw err
            } finally {
                connection.release();
            }
        } catch (err) {
            throw err
        }
        return result;
    },
    /**
     * 执行sql语句，自己传pool对象
     * @param {string} poolAlias 连接池
     * @param {string} sql sql语句
     * @param {object[]} param sql参数
     * @returns {Promise<number>}
     */
    execSqlPool: async function (poolAlias, sql, param) {
        let result = 0
        try {
            let connection = await this.getConn(poolAlias);
            try {
                result = await this.execSqlByConn(connection, sql, param)
            } catch (err) {
                throw err
            } finally {
                connection.release();
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
    execSqlByTransactionPool: async function (pool, sql, param) {
        let result = 0
        try {
            let connection = await this.getConn(pool);
            try {
                result = await this.execSqlByConn(connection, sql, param)
                //提交事务
                await connection.commit();
            } catch (err) {
                await connection.rollback();
                throw err
            } finally {
                connection.release();
            }
        } catch (err) {
            throw err
        }
        return result;
    },
    /**
     * 执行sql语句
     * @param {object} connection 连接对象
     * @param {string} sql sql语句
     * @param {object[]} param sql参数
     * @returns {Promise<unknown>}
     */
    execSqlByConn: async function (connection, sql, param) {
        let sqlStr = this.getSqlStr(sql, param);
        let result = await connection.execute(sqlStr, param);
        return result;
    },
    /**
     * 执行sql语句
     * @param {string} sql sql语句
     * @param {object[]} param sql参数
     * @returns {Promise<number>}
     */
    execSql: async function (sql, param) {
        return await this.execSqlPool(null, sql, param);
    },
    /**
     * 返回记录集的
     * @param {string} sql sql语句
     * @param {object[]} param sql参数
     * @returns {Promise<*[]>}
     */
    querySql: async function (sql, param) {
        return await this.querySqlPool(null, sql, param);
    },
    /**
     * 执行带事务的sql语句
     * @param {} sql
     * @param {} param
     * @param pool
     * @returns {Promise<number>}
     */
    execSqlByTransaction: async function (sql, param) {
        return await this.execSqlByTransactionPool(null, sql, param);
    },
};