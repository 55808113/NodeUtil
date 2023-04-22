/**
 * mysql数据库相关函数
 *
 * */
const _ = require('lodash')

const SQL_TYPE = {
    MYSQL:0,//mysql数据库
    MSSQL:1,//mssql数据库
    ORACLE:2//oracle数据库
}
/**
 * mysql连接数据库的类
 */
class sqlHelper {
    options = {
        sqlType:SQL_TYPE.MSSQL
    }
    /**
     *
     * @param {sqlHelper.SQL_TYPE} sqlType
     */
    constructor(sqlType) {
        this.options.sqlType = sqlType
    }
    /**
     * 连接池
     * @type {null}
     */
    pool = null

    /**
     * 执行sql语句，自己传pool对象
     * @param {string} sql sql语句
     * @param {object[]} [params] sql参数
     * @returns {Promise<object[]>}
     * @example
     * await execSql("call a()",[param.a,param.b])
     */
    async execSql (sql, params) {
        return null;
    }

    async getConnection(fn){

    }


    /**
     * 执行sql语句
     * @param {Connection} connection 连接对象
     * @param {string} sql sql语句
     * @param {object[]} params sql参数
     * @returns {Promise<object>}
     */
    execSqlByConnection (connection, sql, params) {

    }

};
module.exports = sqlHelper
module.exports.SQL_TYPE = SQL_TYPE
