/**
 * 网络函数
 */


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

};
