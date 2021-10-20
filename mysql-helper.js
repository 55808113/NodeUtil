/**
 * 数据库相关函数
 *
 * */
const mysql = require('mysql')
const {$configlocal} = require('../../../config')
const $log4js = require('./log4js')
// 使用连接池，提升性能
const pool = mysql.createPool($configlocal.mysql);

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
     * @returns {Promise<unknown>}
     */
    getConn: function () {
        return new Promise((resolve, reject) => {
            const start = new Date()
            pool.getConnection(function (err, connection) {
                const ms = new Date() - start
                if (err) {
                    $log4js.sqlErrLogger("创建连接池", "错误", err, ms)
                    reject(err)
                    return;
                }
                //$log4js.sqlInfoLogger("创建连接池", "成功", ms)
                resolve(connection)
            })
        })
    },
    /**
     * 开启事务：
     * @param connection
     * @returns {Promise<boolean>} 返回true成功，false失败
     */
    beginTransaction: function (connection){
        return new Promise((resolve, reject) => {
            connection.beginTransaction(err => {
                if (err) {
                    reject(err)
                }
                resolve(true)
            })
        })
    },
    /**
     * 执行sql语句
     * @param {object} connection 连接对象
     * @param {string} sql sql语句
     * @param {object[]} param sql参数
     * @returns {Promise<unknown>}
     */
    execSqlByConn: function (connection, sql, param) {
        const start = new Date()
        let sqlStr = this.getSqlStr(sql, param);
        return new Promise((resolve, reject) => {
            connection.query(sqlStr, param, (err, result) => {
                //connection.release();
                const ms = new Date() - start
                if (err) {
                    $log4js.sqlErrLogger(sqlStr, param, err, ms)
                    reject(err)
                    return;
                }
                $log4js.sqlInfoLogger(sqlStr, param, ms)
                resolve(result)
            })
        })
    },
    /**
     * 执行sql语句
     * @param {string} sql sql语句
     * @param {object[]} param sql参数
     * @returns {Promise<number>}
     */
    execSql: async function (sql, param) {
        let result = 0
        try {
            let connection = await this.getConn();
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
     * @param sql
     * @param param
     * @returns {Promise<number>}
     */
    execSqlByTransaction: async function (sql, param) {
        let result = 0
        try {
            let connection = await this.getConn();
            await this.beginTransaction(connection);
            try {
                result = await this.execSqlByConn(connection, sql, param)
                connection.commit((error) => {
                    if(error) {
                        throw error;
                        console.log('事务提交失败')
                    }
                })
            } catch (err) {
                connection.rollback();
                throw err
            } finally {
                connection.release();
            }
        } catch (err) {
            throw err
        }
        return result;
    }
};