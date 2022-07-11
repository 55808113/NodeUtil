/**
 日志记录
 */
const log4js = require('log4js')
const debugSqlInfo = require('debug')('sqlinfo');
const path = require('path')
class logger {
    constructor() {
        let self = this
        log4js.configure({
            appenders: {
                error: {
                    type: 'dateFile',           //日志类型可以是file或者dataFile
                    category: 'errLogger',    //日志名称
                    filename: path.join(self.loggerDir.root, self.loggerDir.error, "err"), //日志输出位置，当目录文件或文件夹不存在时自动创建
                    pattern: 'yyyy-MM-dd.log', //日志输出模式
                    alwaysIncludePattern: true,
                    maxLogSize: 104800, // 文件最大存储空间
                    backups: 100  //当文件内容超过文件存储空间时，备份文件的数量
                },
                response: {
                    type: 'dateFile',
                    category: 'resLogger',
                    filename: path.join(self.loggerDir.root, self.loggerDir.response, "res"),
                    pattern: 'yyyy-MM-dd.log', //日志输出模式
                    alwaysIncludePattern: true,
                    maxLogSize: 104800,
                    backups: 100
                },
                sqlInfo: {
                    type: 'dateFile',
                    category: 'sqlInfoLogger',
                    filename: path.join(self.loggerDir.root, self.loggerDir.sqlInfo, "sqlInfo"),
                    pattern: 'yyyy-MM-dd.log', //日志输出模式
                    alwaysIncludePattern: true,
                    maxLogSize: 104800,
                    backups: 100
                },
                sqlErr: {
                    type: 'dateFile',
                    category: 'sqlErrLogger',
                    filename: path.join(self.loggerDir.root, self.loggerDir.sqlErr, "sqlErr"),
                    pattern: 'yyyy-MM-dd.log', //日志输出模式
                    alwaysIncludePattern: true,
                    maxLogSize: 104800, // 文件最大存储空间
                    backups: 100  //当文件内容超过文件存储空间时，备份文件的数量
                }
            },
            categories: {
                error: {appenders: ['error'], level: 'error'},
                response: {appenders: ['response'], level: 'info'},
                sqlErr: {appenders: ['sqlErr'], level: 'error'},
                sqlInfo: {appenders: ['sqlInfo'], level: 'info'},
                default: {appenders: ['response'], level: 'info'}
            },
            replaceConsole: true,
            /*pm2: true,
            pm2InstanceVar: 'INSTANCE_ID',*/
            //添加pm2的支持。如果是pm2需要添加这个配置才能打印出日志
            disableClustering: process.env.NODE_APP_INSTANCE !=undefined?true:false
        })
        this._errorLogger = log4js.getLogger('error')
        this._resLogger = log4js.getLogger('response')
        this._sqlInfoLogger = log4js.getLogger('sqlInfo')
        this._sqlErrLogger = log4js.getLogger('sqlErr')
    }
    _errorLogger = null
    _resLogger = null
    _sqlInfoLogger = null
    _sqlErrLogger = null
    /**
     * 日志的路径
     * @type {object}
     */
    loggerDir = {
        root: path.join(process.cwd(), '/logs/'),
        error: "error/",
        response:"responses/",
        sqlInfo: "sqlInfo/",
        sqlErr: "sqlErr/"
    }
    /**
     * 封装错误日志
     * @param ctx
     * @param {object} error
     * @param resTime 请的时间
     */
    errLogger (ctx, error, resTime) {
        if (error) {
            let log
            if (ctx) {
                let method = ctx.method
                let url = ctx.url
                let body = ctx.request.body
                let userAgent = ctx.header.userAgent
                log = {method, url, body, resTime, userAgent, error}
            } else {
                log = {resTime, error}
            }
            console.error(error);
            this._errorLogger.error(log)
        }
    }
    /**
     * 封装响应日志
     * @param ctx
     * @param resTime 请求的时间
     */
    resLogger (ctx, resTime){
        if (ctx) {
            let log
            let method = ctx.method
            let url = ctx.url
            let body = ctx.request.body
            let response = ctx.response
            //如果返回网页不记录日志，因为数据太多了。
            if (response.header["content-type"] && response.header["content-type"].indexOf("/json") != -1) {
                log = {method, url, body, resTime, response}
                this._resLogger.info(log)
            }
        }
    }
    /**
     * 数据操作日志
     * @param {string} sql sql语句
     * @param {object[]} param sql参数
     * @param sqlTime 执行时间
     */
    sqlInfoLogger (sql, param, sqlTime){
        let log
        log = {sql, param, sqlTime}
        debugSqlInfo(log)
        this._sqlInfoLogger.info(log)
    }
    /**
     * 数据错误日志
     * @param {string} sql sql语句
     * @param {object[]} param sql参数
     * @param {object} error 错误信息
     * @param sqlTime 执行时间
     */
    sqlErrLogger(sql, param, error, sqlTime=0) {
        let log
        log = {sql, param, error, sqlTime}
        console.error(error);
        this._sqlErrLogger.error(log)
    }
}

module.exports = new logger()