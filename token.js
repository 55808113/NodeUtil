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
            payload: payload,
            signature: decArr[1],
            checkSignature: checkSignature
        }
    },
    /**
     * 检查Token
     * @param ctx
     * @returns {boolean} 是否成功
     */
    checkToken: function (ctx) {
        let token = ctx.request.body.token || ctx.request.query.token || ctx.request.headers['token'] || ctx.session.token || ctx.cookies.get('token');
        if (!token) return false;
        let resDecode = this.decodeToken(token);
        if (!resDecode) {
            return false;
        }
        //是否过期
        let expState = (parseInt(Date.now() / 1000) - parseInt(resDecode.payload.created)) > parseInt(resDecode.payload.exp) ? false : true;
        if (resDecode.signature === resDecode.checkSignature && expState) {
            //如果cookies没有设置就设置给html
            if (ctx.session.token != token) {
                ctx.session.token = token;
                ctx.session.pkid = resDecode.payload.data.pkid;
                ctx.session.cd_info_ssgx = resDecode.payload.data.cd_info_ssgx;
                ctx.session.usernm = resDecode.payload.data.usernm;
                ctx.session.rights = $convert.strToArray(resDecode.payload.data.rights, ",");
            }
            ctx.cookies.set('token', token, {signed: true, maxAge: 7200000})
            return true;
        }
        return false;
    },
    /**
     * 检查权限
     * @param ctx
     * @param {object} param 传过来的参数值
     * {
     *  isall:是否完全配置路径
     *  name:参数值
     *  tgparams:可能不用认证的参数数组
     * }
     * @returns {boolean}
     */
    checkRight: function (ctx, param = {isall: false, value: "", tgparams: []}) {
        let b = false
        let paramobj = Object.assign({isall: false, value: "", tgparams: []}, param)
        let urlobj = url.parse(ctx.url, true);
        if (paramobj.isall) {
            if (ctx.session.rights.indexOf(urlobj.path) != -1) {
                b = true
            }
        } else if (ctx.session.rights.indexOf(urlobj.pathname) != -1 || (paramobj.tgparams.indexOf(paramobj.value) != -1)) {
            b = true
        }

        if (!b) {
            console.error(`${chalk.red(ctx.session.usernm + "没有权限网页" + urlobj.pathname + ":" + paramobj.value)}`)
            $log4js.errLogger(ctx, ctx.session.usernm + "没有权限网页" + urlobj.pathname + ":" + paramobj.value)
        }
        return b
    }
}
module.exports = token;
