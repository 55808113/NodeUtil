/**
 * mysql数据库相关函数
 *
 * */

const mysql = require('mysql')
const _ = require('lodash')
const $log4js = require('./log4js')
const $util = require('./util')
const $convert = require('./convert')
const $sqlHelper = require('./sql-helper')
/**
 * mysql连接数据库的类
 */
class mysqlHelper extends $sqlHelper {
    constructor() {
        super($sqlHelper.SQL_TYPE.MYSQL);
    }
    /**
     * 创建一个连接池
     * @param {object|string} config 数据库配置文件
     * @return {Pool} 连接池对象
     * @public
     */
    createPool (config){
        this.pool= mysql.createPool(config)
        console.log("开始创建连接池mysql！")
        return this.pool
    }
    /**
     * 拼写sql存储过程语句
     * @param {string} sql sql语句
     * @param {object[]} params 参数数组
     * @returns {string} 合并好的sql语句
     * @example
     * getSqlStr("call a()",[param.a,param.b])
     * 返回 call a(?,?)
     */
    getSqlStr (sql, params=[]) {
        let result = "";
        if (sql.indexOf("call ") != -1) {
            result = sql.replace(")", "");
            let b = (sql.length - sql.indexOf("(")) > 2;
            for (let i = 0; i < params.length; i++) {
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
    }
    /**
     * 得到getConnection
     * @returns {Promise<Connection>}
     */
    getConn () {
        let self = this;
        return new Promise((resolve, reject) => {
            const start = new Date()
            self.pool.getConnection(function (err, connection) {
                const ms = new Date() - start
                if (err) {
                    $log4js.sqlErrLogger("创建连接池", "错误", err, ms)
                    reject(err)
                    return;
                }
                //console.log("mysql创建连接池成功！")
                //$log4js.sqlInfoLogger("创建连接池", "成功", ms)
                resolve(connection)
            })
        })
    }
    /**
     * 执行sql语句，自己传pool对象
     * @param {string} sql sql语句
     * @param {object[]} [params] sql参数
     * @returns {Promise<object[]>}
     * @example
     * await execSql("call a()",[param.a,param.b])
     */
    async execSql (sql, params) {
        let self = this
        let result = 0
        params = params || []
        await this.execByConnection(async function (connection){
            result = await self.execSqlByConn(connection, sql, params)
        })

        return result;
    }

    /**
     * 执行带事务的sql语句
     * @param {string} sql sql语句
     * @param {object[]} params sql参数
     * @returns {Promise<number>}
     * @example
     * await $sqlhelper.execSqlByTransaction("call sp_card_add()", [param.sfzh, param.xm])
     */
    async execSqlByTransaction (sql, params) {
        let result = 0
        let self = this;
        await this.execByTransaction(async function (connection){
            result = await self.execSqlByConn(connection, sql, params)
        })
        /*let connection = await this.getConn();
        try {
            await this._beginTransaction(connection);
            result = await this.execSqlByConn(connection, sql, params)
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
            this._pool.releaseConnection(connection)
        }*/
        return result;
    }

    /**
     * 执行事务的函数
     * @param {function} fn 返回的函数
     * @returns {Promise<void>}
     * @example
     * await $sqlhelper.execByTransaction(async function(connection){
            let userPkids = JSON.parse(param.userpkids);
            for (const userPkid of userPkids) {
                await $sqlhelper.execSqlByConn(connection, "call sp_sysuserrole_add()", [userPkid, param.cd_sysrole_pkid])
            }
        })
     */
    async execByTransaction (fn) {
        let connection = await this.getConn();
        await this._beginTransaction(connection);
        try {
            if (fn){
                await fn(connection)
            }
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
            this.pool.releaseConnection(connection)
            //connection.release();
        }
    }
    async execByConnection (fn) {
        let connection = await this.getConn();
        try {
            if (fn){
                await fn(connection)
            }
        } catch (err) {
            throw err
        } finally {
            this.pool.releaseConnection(connection)
            //connection.release();
        }
    }
    /**
     * 得到所有表数据
     * @returns {Promise<object>}
     */
    async selectAllByTableName (){
        let sql = "SELECT table_name tablename, ENGINE, table_comment tablecomment, create_time createTime FROM information_schema.TABLES WHERE table_schema = (SELECT DATABASE())"
        return await this.execSql(sql);
    }
    /**
     * 得到某个表的所有字段名称
     * @param {string} tablename 查询的表名
     * @returns {Promise<Object>}
     */
    async selectAllByTableFieldName (tablename) {
        let sql = "SELECT column_name columnName,data_type dataType,column_comment columnComment,column_key columnKey,extra FROM information_schema.COLUMNS WHERE table_name = ? AND table_schema = (SELECT DATABASE()) ORDER BY ordinal_position;"
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
    async selectAllByTablePage (tablename, pageIndex, pageSize, order, sort, sqlData, options) {
        options = _.assign({},{id:"pkid"}, options)
        let sqlOrder = ""
        let sql = ""
        let totalCount = 0
        let bgnID = 1
        sqlData = $convert.getString(sqlData)
        if (pageSize!=-1) {
            bgnID = (pageIndex - 1) * pageSize
            if ($util.isNotEmpty(sort)) {
                sqlOrder =  `  order by ${sort} ${order}`
            }
            sql = `select count(0) as totalCount from ${tablename} where 1=1 ${sqlData}`
            //得到总数
            let row = await this.execSql(sql);
            totalCount = row[0].totalCount
        }
        sql = `select ${totalCount} AS TOTAL,a.* FROM ${tablename}
            a JOIN (select ${options.id} from ${tablename}
             where 1=1 ${sqlData}`;
        if (pageSize!=-1){
            sql += ` ${sqlOrder} limit ${bgnID},${pageSize}`
        }
        sql +=  ` ) b ON a.${options.id} = b.${options.id}`
        if (pageSize!=-1) {
            sql += ` ${sqlOrder}`
        }
        return await this.execSql(sql);
    }
    /**
     * 开启事务：
     * @param {Connection} connection
     * @returns {Promise<boolean>} 返回true成功，false失败
     */
    _beginTransaction (connection){
        return new Promise((resolve, reject) => {
            connection.beginTransaction(err => {
                if (err) {
                    reject(err)
                }
                resolve(true)
            })
        })
    }
    /**
     * 执行sql语句
     * @param {Connection} connection 连接对象
     * @param {string} sql sql语句
     * @param {object[]} params sql参数
     * @returns {Promise<unknown>}
     */
    execSqlByConn (connection, sql, params) {
        const start = new Date()
        let sqlStr = this.getSqlStr(sql, params);
        return new Promise((resolve, reject) => {
            connection.query(sqlStr, params, (err, result) => {
                //connection.release();
                const ms = new Date() - start
                if (err) {
                    $log4js.sqlErrLogger(sqlStr, params, err, ms)
                    reject(err)
                    return;
                }
                $log4js.sqlInfoLogger(sqlStr, params, ms)
                resolve(result)
            })
        })
    }
    /**
     * 设置group_concat_max_len为10240的大小
     * @param {number} group_concat_max_len
     * @returns {Promise<Object[]>}
     */
    async setGroup_concat_max_len (group_concat_max_len){
        group_concat_max_len = group_concat_max_len || 10240
        let sql = `SET GLOBAL group_concat_max_len = ${group_concat_max_len};`
        //sql += `SET SESSION group_concat_max_len = ${group_concat_max_len};`
        await this.execSql(sql);
        sql = `SET SESSION group_concat_max_len = ${group_concat_max_len};`
        return await this.execSql(sql);
    }
};
module.exports = new mysqlHelper()
module.exports.mysqlhelper = mysqlHelper
