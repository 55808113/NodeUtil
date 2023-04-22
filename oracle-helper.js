/**
 * oracle数据库相关函数
 * @example
 * 配置文件
 * oracle: {
        //_enableStats: true,
        user:'clf_henan',　　//用户名
        password:'clf',　　//密码
        //IP:数据库IP地址，PORT:数据库端口，SCHEMA:数据库名称
        connectString : "localhost:1521/ORCL",
        poolAlias: "default", //起一个别名用来识别不同的连接池,可以为空，默认为default
        poolMin:10, //开始的连接池个数
        poolMax:100
    },
 * */

const oracle = require('oracledb')
const $log4js = require('./log4js')
const $sqlHelper = require('./sql-helper')
/**
 * oracle数据库相关函数
 */
class oraclehelper extends $sqlHelper {
    constructor() {
        super($sqlHelper.SQL_TYPE.ORACLE);
    }
    /**
     * resultSet记录集对象转换成json数组格式
     * @param {object} resultSet
     * @private
     */
    async _resultSetToJson (resultSet){
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
    }
    /**
     * 创建连接池
     * @param {object|string} config 连接的配置信息
     * @return {Pool} 连接池对象
     * @public
     */
    createPool (config,callback){
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
    }
    /**
     * 拼写sql存储过程语句
     * @param {string} sql sql语句
     * @param {object[]} [params] 参数数组
     * @returns {*}
     * @private
     */
    getSqlStr (sql, params) {
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
    }
    /**
     * 得到getConnection
     * @param {string} poolAlias 连接池别名
     * @returns {Promise<Connection>}
     */
    async _getConnection (poolAlias) {
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
    }
    /**
     * 存储过程查询需要的
     * @param {string} poolAlias
     * @param {string} sql
     * @param {object[]} [params]
     * @returns {Promise<object[]>}
     */
    async querySqlPool (poolAlias, sql, params) {
        let result = [];
        try {
            let connection = await this._getConnection(poolAlias);
            try {
                //第一个参数是游标参数需要设置一下
                params.splice(0,0,{ type: oracle.CURSOR, dir: oracle.BIND_OUT  });
                let data = await this.execSqlByConnection(connection, sql, params)
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
    }
    /**
     * 执行sql语句，自己传pool对象
     * @param {string} poolAlias 连接池
     * @param {string} sql sql语句
     * @param {object[]} [params] sql参数
     * @returns {Promise<number>}
     */
    async execSqlPool (poolAlias, sql, params) {
        let result = 0
        try {
            let connection = await this._getConnection(poolAlias);
            try {
                result = await this.execSqlByConnection(connection, sql, params)
            } catch (err) {
                throw err
            } finally {
                connection.release();
            }
        } catch (err) {
            throw err
        }
        return result;
    }
    /**
     * 执行带事务的sql语句
     * @param {string} poolAlias 连接池对象
     * @param {string} sql sql语句
     * @param {object[]} [params] sql参数
     * @returns {Promise<number>}
     */
    async execSqlByTransactionPool (poolAlias, sql, params) {
        let result = 0
        try {
            let connection = await this._getConnection(poolAlias);
            try {
                result = await this.execSqlByConnection(connection, sql, params)
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
    }
    /**
     * 执行sql语句
     * @param {Connection} connection 连接对象
     * @param {string} sql sql语句
     * @param {object[]} [params] sql参数
     * @returns {Promise<unknown>}
     */
    async execSqlByConnection (connection, sql, params) {
        let sqlStr = this.getSqlStr(sql, params);
        let result = await connection.execute(sqlStr, params);
        return result;
    }
    /**
     * 执行sql语句
     * @param {string} sql sql语句
     * @param {object[]} [params] sql参数
     * @returns {Promise<number>}
     */
    async execSql (sql, params) {
        return await this.execSqlPool(null, sql, params);
    }
    /**
     * 返回记录集的
     * @param {string} sql sql语句
     * @param {object[]} [params] sql参数
     * @returns {Promise<object[]>}
     */
    async querySql (sql, params) {
        return await this.querySqlPool("", sql, params);
    }
    /**
     * 执行带事务的sql语句
     * @param {string} sql
     * @param {object[]} params
     * @returns {Promise<number>}
     */
    async execTransactionSql(sql, params) {
        return await this.execSqlByTransactionPool("", sql, params);
    }
};

module.exports = new oraclehelper()
module.exports.oraclehelper = oraclehelper