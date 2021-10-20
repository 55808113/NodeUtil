/**
 * 认证对象
 */
const chalk = require('chalk')
const url = require('url')
const $log4js = require('./log4js')
const $convert = require('./convert')
const $crypto = require('./crypto')
const token = {
    /**
     * 得到Token字符串
     * @param ctx
     * @returns {string} 如果是null，表示没有取得
     */
    getTokenString: function (ctx){
        return ctx.request.body.token || ctx.request.query.token || ctx.request.headers['Authorization'] || ctx.request.headers['token'] || ctx.session.token || ctx.cookies.get('token');
    },
    /**
     * 创建Token
     * @param {object} obj 数据对象
     * @param {int} timeout 过期时间：默认有效期为一天
     * @returns {string}
     */
    createToken: function (obj, timeout = 24 * 60 * 60) {
        //console.log(parseInt(timeout)||0);
        let obj2 = {
            data: obj,//payload
            created: parseInt(Date.now() / 1000),//token生成的时间的，单位秒
            exp: parseInt(timeout) || 24 * 60 * 60//token有效期为一天
        };

        //payload信息
        let base64Str = Buffer.from(JSON.stringify(obj2), "utf8").toString("base64");
        //添加签名，防篡改
        let signature = $crypto.SHA.HmacSHA256(base64Str)
        return base64Str + "." + signature;
    },
    /**
     * 解密Token
     * @param {string} token字符串
     * @returns {boolean|{payload: (*|{}), signature: *, checkSignature}} token对象
     * {
     *     //数据
     *     payload: {
     *         //数据返回的数据内容
     *         data: {},
     *         //token生成的时间的，单位秒
     *         created: 10000,
     *         //token有效期为一天
     *         exp: 24 * 60 * 60
     *     },
     *     //签名
     *     signature: '',
     *     //检验签名
     *     checkSignature: ''
     * }
     *
     */
    decodeToken: function (token) {
        let decArr = $convert.strToArray(token, ".")
        if (decArr.length < 2) {
            //token不合法
            return false;
        }

        let payload = {};
        //将payload json字符串 解析为对象
        try {
            payload = JSON.parse(Buffer.from(decArr[0], "base64").toString("utf8"));
        } catch (e) {
            return false;
        }

        //检验签名
        let checkSignature = $crypto.SHA.HmacSHA256(decArr[0])

        return {
            //数据内容
            payload: payload,
            //签名
            signature: decArr[1],
            //检验签名
            checkSignature: checkSignature
        }
    },

    /**
     * 得到Token的返回的对象
     * @param {string} token
     * @returns {object} 如果是null，表示没有取得
     */
    getTokenData: function (ctx){
        let token = this.getTokenString(ctx)
        if (!token) return null;
        let resDecode = this.decodeToken(token);
        if (!resDecode) {
            return null;
        }
        //是否过期
        let expState = (parseInt(Date.now() / 1000) - parseInt(resDecode.payload.created)) > parseInt(resDecode.payload.exp) ? false : true;
        if (resDecode.signature === resDecode.checkSignature && expState) {
            let data = resDecode.payload.data
            ctx.session.pkid = data.pkid;
            ctx.session.cd_info_ssgx = data.cd_info_ssgx;
            ctx.session.usernm = data.usernm;
            /*//如果cookies没有设置就设置给html
            if (ctx.session.token != token) {
                ctx.session.token = token;
                ctx.session.pkid = resDecode.payload.data.pkid;
                ctx.session.cd_info_ssgx = resDecode.payload.data.cd_info_ssgx;
                ctx.session.usernm = resDecode.payload.data.usernm;
                ctx.session.rights = $convert.strToArray(resDecode.payload.data.rights, ",");
            }
            ctx.cookies.set('token', token, {signed: true, maxAge: 7200000})*/
            return data;
        }
        return null;
    },
    /**
     * 检查Token
     * @param ctx
     * @returns {boolean} 是否成功
     */
    checkToken: function (ctx) {
        let result = this.getTokenData(ctx)
        if (result) {
            return true;
        }
        return false;
    }
}
module.exports = token;
