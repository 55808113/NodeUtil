/**
 日志记录
 */
const log4js = require('log4js')
const path = require('path')

log4js.configure({
    appenders: {
        error: {
            type: 'dateFile',           //日志类型可以是file或者dataFile
            category: 'errLogger',    //日志名称
            filename: path.join(__dirname, '/../../logs/error/'), //日志输出位置，当目录文件或文件夹不存在时自动创建
            pattern: 'yyyy-MM-dd.log', //日志输出模式
            alwaysIncludePattern: true,
            maxLogSize: 104800, // 文件最大存储空间
            backups: 100  //当文件内容超过文件存储空间时，备份文件的数量
        },
        response: {
            type: 'dateFile',
            category: 'resLogger',
            filename: path.join(__dirname, '/../../logs/responses/'),
            pattern: 'yyyy-MM-dd.log', //日志输出模式
            alwaysIncludePattern: true,
            maxLogSize: 104800,
            backups: 100
        },
        sqlInfo: {
            type: 'dateFile',
            category: 'sqlInfoLogger',
            filename: path.join(__dirname, '/../../logs/sqlInfo/'),
            pattern: 'yyyy-MM-dd.log', //日志输出模式
            alwaysIncludePattern: true,
            maxLogSize: 104800,
            backups: 100
        },
        sqlErr: {
            type: 'dateFile',
            category: 'sqlErrLogger',
            filename: path.join(__dirname, '/../../logs/sqlErr/'),
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
    replaceConsole: true
})


let logger = {}
let errorLogger = log4js.getLogger('error')
let resLogger = log4js.getLogger('response')
let sqlInfoLogger = log4js.getLogger('sqlInfo')
let sqlErrLogger = log4js.getLogger('sqlErr')
/**
 * 封装错误日志
 * @param ctx
 * @param {object} error
 * @param resTime 请的时间
 */
logger.errLogger = (ctx, error, resTime) => {
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
        errorLogger.error(log)
    }
}
/**
 * 封装响应日志
 * @param ctx
 * @param resTime 请求的时间
 */
logger.resLogger = (ctx, resTime) => {
    if (ctx) {
        let log
        let method = ctx.method
        let url = ctx.url
        let body = ctx.request.body
        let response = ctx.response
        //如果返回网页不记录日志，因为数据太多了。
        if (response.header["content-type"] && response.header["content-type"].indexOf("/json") != -1) {
            log = {method, url, body, resTime, response}
            resLogger.info(log)
        }
    }
}
/**
 * 数据操作日志
 * @param {string} sql sql语句
 * @param {object[]} param sql参数
 * @param sqlTime 执行时间
 */
logger.sqlInfoLogger = (sql, param, sqlTime) => {
    let log
    log = {sql, param, sqlTime}
    sqlInfoLogger.info(log)
}
/**
 * 数据错误日志
 * @param {string} sql sql语句
 * @param {object[]} param sql参数
 * @param {object} error 错误信息
 * @param sqlTime 执行时间
 */
logger.sqlErrLogger = (sql, param, error, sqlTime) => {
    let log
    log = {sql, param, error, sqlTime}
    console.error(error);
    sqlErrLogger.error(log)
}
module.exports = logger