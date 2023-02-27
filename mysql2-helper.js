/**
 * mysql数据库相关函数使用mysql2的包
 * 这个包可以把json字段返回json对象。不像mysql包只是返回字符串
 *
 * @example
 * mysql2: {
        host: 'localhost',//MySQL数据库地址
        user: 'root',//MySQL数据库用户
        password: 'sunxdd3154271',//MySQL数据库密码
        database:'my_data', // 前面建的user表位于这个数据库中
        port: 3306, //MySQL数据库端口
        connectionLimit: 10, //一次性建立的最大连接数目  默认为 10
        queueLimit: 100//连接池的最大排队数目 超出报错 如果为0，则没有限制数目，默认为0
    }
 mysql2Helper.createPool(mysql2)
 * */

const mysql2 = require('mysql2/promise')
const _ = require('lodash')
const $log4js = require('./log4js')
const $util = require('./util')
const $convert = require('./convert')
const $sqlHelper = require('./sql-helper')
/**
 * mysql连接数据库的类
 */
class mysql2Helper extends $sqlHelper {
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
        console.log("开始创建连接池mysql！")
        this.pool = mysql2.createPool(config)
        /*// 进程退出时自动关闭连接池
        process.on('exit', async (code) => {
            try {
                await this.pool.end()
            } catch (error) {

            }
        })*/
        /*//测试数据库是否连接成功
        this.pool.getConnection((err, conn) => {
            conn.connect((err) => {
                if (err) {
                    console.log('mysql连接失败~');
                } else {
                    console.log('mysql连接成功~');
                }
            })
        })*/
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
     * @returns {Promise<PoolConnection>}
     */
    async _getConnection () {
        let self = this;
        return await self.pool.getConnection()
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
        let result = {}
        params = params || []
        await this.getConnection(async function (connection){
            result = await self.execSqlByConnection(connection, sql, params)
        })

        return result;
    }

    /**
     * 执行带事务的sql语句
     * @param {string} sql sql语句
     * @param {object[]} params sql参数
     * @returns {Promise<boolean|object>}
     * @example
     * await $mysqlhelper.execTransactionSql("call sp_card_add()", [param.sfzh, param.xm])
     */
    async execTransactionSql(sql, params) {
        let result = false
        let self = this;
        let data = undefined
        await this.getConnectionByTransaction(async function (connection){
            data = await self.execSqlByConnection(connection, sql, params)
        })
        //有的时候需要返回数据
        if (_.isArray(data)){
            return data
        }
        if (data&&data.affectedRows===1){
            result = true
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
    async getConnectionByTransaction (fn) {
        let connection = await this._getConnection();
        await connection.beginTransaction();
        try {
            if (fn){
                await fn(connection)
            }
            await connection.commit()
        } catch (err) {
            connection.rollback();
            throw err
        } finally {
            // 直接释放连接。但是这样会影响速度
            //connection.destroy();
            connection.release()
        }
    }
    async getConnection (fn) {
        let connection = await this._getConnection();
        try {
            if (fn){
                await fn(connection)
            }
        } catch (err) {
            throw err
        } finally {
            // 直接释放连接。但是这样会影响速度
            //connection.destroy();
            connection.release()
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
    /*/!**
     * 开启事务：
     * @param {Connection} connection
     * @returns {Promise<boolean>} 返回true成功，false失败
     *!/
    _beginTransaction (connection){
        return new Promise((resolve, reject) => {
            connection.beginTransaction(err => {
                if (err) {
                    reject(err)
                }
                resolve(true)
            })
        })
    }*/
    /**
     * 执行sql语句
     * @param {Connection} connection 连接对象
     * @param {string} sql sql语句
     * @param {object[]} params sql参数
     * @returns {Promise<unknown>}
     */
    async execSqlByConnection (connection, sql, params) {
        const start = new Date()
        let sqlStr = this.getSqlStr(sql, params);
        try {
            let [result] = await connection.query(sqlStr, params)
            const ms = new Date() - start
            $log4js.sqlInfoLogger(sqlStr, params, ms)
            return result
        }catch (err){
            const ms = new Date() - start
            $log4js.sqlErrLogger(sqlStr, params, err, ms)
            throw err
        }
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
module.exports = new mysql2Helper()
module.exports.mysql2Helper = mysql2Helper
