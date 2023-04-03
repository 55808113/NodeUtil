/**
 * 网络函数
 */
//node访问其它网站的数据的类
const Axios = require("axios")
//常用的js函数类
const _ = require('lodash')
module.exports = {
    /**
     * 建立cookie
     * @param {string} name cookie名称
     * @param {string} val cookie值
     * @param {object} opt cookie相关参数
     * @returns {string}
     */
    setCookie: function (name, val, opt) {
        let pairs = [name + '=' + val];
        opt = opt || {};
        if (opt.maxAge) pairs.push('Max-Age=' + opt.maxAge);
        if (opt.domain) pairs.push('Domain=' + opt.domain);
        if (opt.path) pairs.push('Path=' + opt.path);
        if (opt.expires) pairs.push('Expires=' + opt.exppires.toUTCString());
        if (opt.httpOnly) pairs.push('HttpOnly');
        if (opt.secure) pairs.push('Secure');
        return pairs.join(';');
    },
    /**
     * 得到客户端的IP地址
     * @param ctx
     * @returns {string}
     */
    getClientIP: function (ctx) {
        let req = ctx.req
        let ip = req.headers['x-forwarded-for'] ||
            req.headers['x-real-ip'] ||
            req.ip ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            req.connection.socket.remoteAddress || '';

        if (ip.split(',').length > 0) {
            ip = ip.split(',')[0]
        }
        ip = ip.match(/\d+.\d+.\d+.\d+/)
        return ip = ip ? ip.join('.') : null
    },
    /**
     * nodejs 通过post或者get访问网络资源的函数
     * @param {string} url 路径
     * @param {object} params post或者get参数
     * @param {string} method 提交的方法get或者post 默认这get
     * @param {object} headers 头文件信息
     * @returns {Promise<*>}
     */
    _reqJsonData: async function (url, params = {}, method = 'get', headers = {}) {
        let responseData, apiData = [];
        if (method === 'get') {

            responseData = await Axios.get(url, {
                params: params,
                headers: headers
            })

            /*console.log("url:"+url)
            console.log("config:"+JSON.stringify({
                params: params,
                headers: headers
            }))
            console.log("responseData:"+responseData)*/
        } else if (method === 'post') {
            responseData = await Axios.post(url, params, {headers:headers})
        }

        if (responseData && responseData.status == 200 && !_.isEmpty(responseData.data)) {
            return responseData.data;
        } else {
            throw new Error(responseData.data.message);
        }
    },
    /**
     * nodejs 通过get访问网络资源的函数
     * @param {string} url 路径
     * @param {object} headers 头文件信息
     * @returns {Promise<*>}
     */
    getJsonData:async function (url, params = {}, headers = {}) {
        return await this._reqJsonData(url,params,"get",headers)
    },
    /**
     * nodejs 通过post访问网络资源的函数
     * @param {string} url 路径
     * @param {object} headers 头文件信息
     * @returns {Promise<*>}
     */
    postJsonData:async function (url, params = {}, headers = {}) {
        return await this._reqJsonData(url,params,"post",headers)
    }
};
