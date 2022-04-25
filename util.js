/**
 * 公共函数
 */
//日期格式的类
const dayjs = require('dayjs');
//生成svg图片的类
//const svgCaptcha = require('svg-captcha')
//数据加密的类
const uuid = require('node-uuid')
//const svg2png = require("svg2png")
const $log4js = require('./log4js')
//常用的js函数类
const _ = require('lodash')

module.exports = {
    //================================================================================
    /**
     * 向前台返回JSON方法的简单封装
     * @param ctx
     * @param {object} data
     */
    jsonWrite: function (ctx, data = {}) {
        if (typeof data === undefined) {
            ctx.body = {
                status: 500,
                data: data || {},
                message: '操作失败'
            }
        } else {
            ctx.body = data
        }
        ctx.status = 200
        ctx.set("Content-Type", "text/json")
    },
    /**
     * 向前台返回JSON方法的简单封装
     * @param ctx
     * @param {object[]} rows 记录集
     * @param {int} pageIndex 当前页
     * @param {int} pageSize 每个个数
     * @param {object} params 返回的其它参数
     */
    jsonWriteEasyui: function (ctx, rows, pageIndex = 1, pageSize = 20, params = {}) {
        if (typeof rows === undefined) {
            ctx.body = {
                status: 500,
                message: '操作失败'
            };
        } else {
            let total = 0;
            if (rows.length > 0) {
                total = rows[0].TOTAL;
            } else {
                pageIndex = 1;
            }

            let easyuiData = {
                status: 200,
                pageIndex: pageIndex,
                pageSize: pageSize,
                total: total,
                rows: rows
            };
            ctx.body = _.assign(easyuiData, params)
        }
    },
    /**
     * 向前台返回JSON方法的简单封装这个是代footer的数据集合。
     * @param ctx
     * @param {object} data 记录集必须是两个数据集合。data.rows,data.footer
     * @param {int} pageIndex 当前页
     * @param {int} pageSize 每个个数
     * @param {object} params 返回的其它参数
     */
    jsonWriteEasyuiByFooter: function (ctx, data, pageIndex = 1, pageSize = 20, params = {}) {
        if (typeof data === undefined) {
            ctx.body = {
                status: 500,
                message: '操作失败'
            };
        } else {
            let total = 0;
            if (this.isNotEmpty(data)&&this.isNotEmpty(data.rows)){
                if (data.rows.length > 0) {
                    total = data.rows[0].TOTAL;
                } else {
                    pageIndex = 1;
                }
            }

            let easyuiData = {
                status: 200,
                pageIndex: pageIndex,
                pageSize: pageSize,
                total: total,
                rows: data.rows,
                footer: data.footer
            };
            ctx.body = _.assign(easyuiData, params)
        }
    },
    /**
     * 返回treegrid的json对象
     * @param ctx
     * @param rows 记录集
     * @param fieldOpt 记录的字段名称
     * {
     *     id:"pkid", //主键
     *     parentid:"parentid", //父节点id
     * }
     * @param expand 是否扩展全部节点
     * @param params 其它参数信息
     */
    jsonWriteTreegrid: function (ctx, rows, fieldOpt, expand = false, params = {}) {
        /**
         * 查询一条数据是否有子集
         * @param parentid
         * @param rows
         * @returns {null|*}
         * @private
         */
        function _findChild(id) {
            if (_.isNull(id)) return null;
            for (let i = 0; i < rows.length; i++) {
                let row = rows[i];
                //console.log(JSON.stringify(node));
                if (id == row[fieldOpt.parentid]) {
                    return true;
                }
            }
            return false;
        }

        if (typeof rows === undefined) {
            ctx.body = {
                status: 500,
                message: '操作失败'
            };
        } else {
            let total = 0;
            /*if (rows.length > 0) {
                total = rows[0].TOTAL;
            }*/
            if (!expand) {
                fieldOpt = _.assign({},
                    {
                        id: "pkid",
                        parentid: "parentid"
                    }, fieldOpt);
                for (let i = 0; i < rows.length; i++) {
                    let row = rows[i];
                    if (_findChild(row[fieldOpt.id])) {
                        row.state = "closed";
                    }
                }
            }
            let easyuiData = {
                status: 200,
                total: total,
                rows: rows
            };
            ctx.body = _.assign(easyuiData, params)
        }
    },
    /**
     * 返回成功
     * @param ctx
     * @param {string} message 返回的信息
     * @param {object} data 返回的数据对象
     */
    resultSUCCESS: function (ctx, message = '', data = {}) {
        ctx.body = {
            status: 200,
            data: data || {},
            message: message || '操作成功'
        }
        ctx.status = 200
        ctx.set("Content-Type", "text/json")
    },
    /**
     * 返回错误的信息
     * @param ctx
     * @param {string} message 返回的信息
     * @param {object} data 返回的数据对象
     */
    resultFAIL: function (ctx, message = '', data = {}) {
        if (!this.isEmpty(message)) {
            // throw new Error(message);
            if (message instanceof Object) {
                message = message.message;
            }
            ctx.body = {
                status: 500,
                message: message,
                data: data || {},
            }
            ctx.status = 200;
            ctx.set("Content-Type", "text/json")
        } else {
            throw new Error(message);
        }
    },
    /**
     * 返回错误的信息
     * @param ctx
     * @param {object} err
     */
    resultERROR: function (ctx, err) {
        $log4js.errLogger(ctx, err)
        ctx.status = err.statusCode || err.status || 500;
        if (err instanceof Object) {
            err = err.message;
        }
        ctx.body = err
        // 手动触发error事件
        //ctx.app.emit('error', err, ctx);
    },
    /**
     * 得到当前系统日期
     * @returns {string}
     */
    getNowDate: function () {
        return dayjs().format('YYYY-MM-DD');
    },
    /**
     * 得到当前系统日期时间
     * @returns {string}
     */
    getNowDateTime: function () {
        return dayjs().format('YYYY-MM-DD HH:mm:ss');
    },
    /*
    * 生成认证码
    * */
    //getCode: function (ctx) {
    //    let outputBuffer;
    //    // 验证码，对了有两个属性，text是字符，data是svg代码
    //    let code = svgCaptcha.create({
    //        // 翻转颜色
    //        inverse: false,
    //        // 验证码字符中排除 0o1i
    //        //ignoreChars: '0o1il',
    //        //验证码字符
    //        charPreset: 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnopqrstuvwxyz23456789',
    //        // 字体大小
    //        fontSize: 25,
    //        // 噪声线条数
    //        noise: 0,
    //        // 宽度
    //        width: 60,
    //        // 高度
    //        height: 25
    //    });
    //    // 保存到session,忽略大小写
    //    ctx.session.randomcode = code.text.toLowerCase();
    //    let ieVerison = ctx.req.headers["user-agent"];
    //    if (ieVerison.indexOf("Mozilla/4.0") == -1 && ieVerison.indexOf("Mozilla/3.0") == -1 && ieVerison.indexOf("Mozilla/2.0") == -1) {
    //        ctx.set('Content-Type', 'image/svg+xml');
    //        outputBuffer = String(code.data);
    //    }
    //    else {
    //        ctx.set('Content-Type', 'image/png');
    //        outputBuffer = svg2png.sync(code.data, { width: 60, height: 25 });
    //    }
    //    // 返回数据直接放入页面元素展示即可
    //    ctx.body = outputBuffer;

    //},
    /**
     * 得到随机的UUID
     * @returns {string}
     * @constructor
     */
    UUID: function () {
        return uuid.v1();
    },

    /**
     * 判断字符串是否为空
     * @param obj
     * @returns {boolean}
     */
    isEmpty: function (obj) {
        if (_.isNil(obj)) {
            return true;
        }
        if (typeof obj === 'string') {
            if (_.trim(obj) === "") {
                return true;
            }
        }
        return false;
    },
    /**
     * 判断是否为空对象
     * @param obj
     */
    isEmptyObject: function (item) {
        if (Object.keys(item).length == 0) {
            return true;
        }
        return false;
    },
    /**
     * 判断是否为不为空对象
     * @param obj
     */
    isNotEmptyObject: function (item) {
        return !this.isEmptyObject(item);
    },
    /**
     * 判断字符串是否不为空
     * @param obj
     */
    isNotEmpty: function (obj) {
        return !this.isEmpty(obj);
    },
    /**
     * 随机数
     * @param {number} min 最小值
     * @param {number} max 最大值
     * @returns {number}
     */
    getRandom: function (min, max) {
        return min + Math.random() * (max - min);
    },
    /**
     * 随机整数
     * @param {number} min 最小值
     * @param {number} max 最大值
     * @returns {number}
     */
    randomNum: function (min, max) {
        return Math.floor(this.getRandom(min, max));
    },
    /**
     *
     * @param {number} min 最小值
     * @param {number} max 最大值
     * @returns {string}
     */
    randomColor: function (min, max) {
        var _r = this.randomNum(min, max);
        var _g = this.randomNum(min, max);
        var _b = this.randomNum(min, max);
        return "rgb(" + _r + "," + _g + "," + _b + ")";
    },
    /**
     * 替换全部内容
     * @param str
     * @param pattern
     * @param replacement
     * @returns {string}
     */
    replaceAll: function (str,pattern,replacement){
        let result = str
        while (result.indexOf(pattern)!=-1){
            result = _.replace(result,pattern,replacement);
        }
        return result
    },
    /**
     * 解决eval的错误提示
     * @param {string} command
     * @returns {*}
     */
    evil:function (command) {
        var Fn = Function;  //一个变量指向Function，防止有些前端编译工具报错
        if (command.indexOf("return")!=-1){
            return new Fn(command)();
        }else{
            return new Fn("return" + command)();
        }
    }
};
