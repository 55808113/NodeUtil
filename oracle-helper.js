/**
 * oracle数据库相关函数
 *
 * */
const oracle = require('oracledb')
const {$configlocal} = require('../../../config')
const $log4js = require('./log4js')
// 使用连接池，提升性能
oracle.createPool($configlocal.oracle);

module.exports = {
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
                result += "?";
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