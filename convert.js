/*
字符串转换函数
 */
const dayjs = require('dayjs');
const _ = require('lodash')
const $util = require('./util')
module.exports = {
    /**
     * 向前台返回JSON方法的简单封装
     * @param {boolean} val 值
     * @param defaultvalue 默认值
     * @returns {boolean}
     */
    getBool: function (val, defaultvalue = false) {
        if ($util.isEmpty(val))
            return defaultvalue
        else if (val === true || _.lowerCase(val) === "true" || val === 1 || val === "1")
            return true
        else
            return false
    },
    /**
     * 得到对象
     * @param {object} val 值
     * @returns {string|null|*}
     */
    getObject: function (val) {
        //添加判断val instanceof Date因为_.isEmpty(val)这个函数无法判断日期
        if ($util.isEmpty(val)) {
            if (typeof (val) == "string") {
                return "";
            } else if (typeof (val) == "number") {
                return null;
            } else {
                return null;
            }
        } else
            return val;
    },
    /**
     * 得到字符类型
     * @param {string} val 值
     * @param {string} defaultvalue 默认值
     * @returns {string|*}
     */
    getString: function (val, defaultvalue = "") {
        if ($util.isEmpty(val))
            return defaultvalue;
        else
            return val;
    },
    /**
     * 得到日期类型
     * @param {Date} val 值
     * @param {Date} defaultvalue 默认值
     * @returns {null|*}
     */
    getDate: function (val, defaultvalue = null) {
        if (!dayjs(val).isValid())
            return defaultvalue;
        else{
            return new Date(val);
        }
    },
    /**
     * 得到数字。如果为空根据默认值返回
     * @param {number} val 值
     * @param {number} defaultvalue 默认值
     * @returns {number}
     */
    getNumber: function (val, defaultvalue = 0) {
        if ($util.isEmpty(val) || _.isNaN(Number(val)))
            return defaultvalue;
        else
            return Number(val);

    },
    /**
     * 格式化日期加时间
     * @param {Date} val 值
     * @param {string} template 格式
     * @returns {string}
     */
    getDateTimeString: function (val, template = "YYYY-MM-DD HH:mm:ss") {
        //千万不要修改为_.isEmpty(val)因为这个函数无法判断日期
        if (!_.isDate(val))
            return "";
        else
            return dayjs(val).format(template);
    },
    /**
     * 格式化日期格式
     * @param {Date} val 值
     * @param {string} template
     * @returns {string}
     */
    getDateString: function (val, template = "YYYY-MM-DD") {
        //千万不要修改为_.isEmpty(val)因为这个函数无法判断日期
        return this.getDateTimeString(val, template);
    },
    /**
     * 字符串转成数组
     * @param {string} str 数组字符串
     * @param {string} sn 分割的字符串
     * @returns {*|Array|string[]} 返回的数组
     */
    strToArray: function(str, sn = ',') {
        let result = []
        if ($util.isNotEmpty(str)) {
            result = str.split(sn); // 在每个逗号(,)处进行分解。
        }
        return result

    },
    /**
     * 数组转成字符串
     * @param {object[]|string} arr
     * @param {string} sn
     * @returns {string} 返回的字符串
     */
    arrayToStr: function(arr, sn = ','){
        let result = "";
        if (Array.isArray(arr)) {
            result = arr.join(sn)
        } else {
            result = arr
        }
        return result
    },
    /**
     * 前台传过来的数组有时是字符串有时是数组。所以通过转换成统一的数组
     * 当选择一个时是string。多个时才是array类型
     * @param arr
     * @returns {*[]}
     */
    paramsToArr: function(arr){
        let result = []
        if ($util.isNotEmpty(arr)) {
            if (_.isArray(arr)) {
                for (let value of arr) {
                    if ($util.isNotEmpty(value)) {
                        result.push(value)
                    }
                }
            } else {
                result.push(arr)
            }
        }
        return result
    },
    /**
     * 字符串转json类型
     * @param str 要转换的字符串
     * @returns {any} 返回JSON对象
     */
    strToJson: function (str) {
        if (!$util.isEmpty(str) && str != 0) {
            try {
                return JSON.parse(str);
            }catch (err){

            }
        }
        return null;
    },
    /**
     * json类型转字符串
     * @param {JSON} json json对象
     * @returns {string} 字符串
     */
    jsonToStr(json) {
        if (!_.isEmpty(json)) {
            return JSON.stringify(json);
        }
    },
    /**
     * 过滤html标签
     * @param {string} str 要过滤的html
     * @returns {string|void|*} 过滤后的字符串
     */
    delhtmltags: function (str) {
        if (!$util.isEmpty(str)) {
            return str.replace(/<[^>]+>/g, ''); // 去掉所有的html标记
        } else {
            return '';
        }
    },
    /**
     * 等比取值
     *
     */
    /**
     * 等比取值
     * @param {number} value
     * @param {number} fromLow
     * @param {number} fromHigh
     * @param {number} toLow
     * @param {number} toHigh
     * @returns {*}
     */
    map: function (value, fromLow, fromHigh, toLow, toHigh) {
        return (value - fromLow) * (toHigh - toLow) / (fromHigh - fromLow) + toLow;
    },
    /**
     * 颜色16进制格式转换为RGB数组
     * @param {string} value 16进制格式的。例如#FFFFFF
     * @returns {array} 返回RGB数组
     */
    colorRgb: function (value) {
        // 16进制颜色值的正则
        let reg = /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/;
        // 把颜色值变成小写
        let color = value.toLowerCase();
        if (reg.test(color)) {
            // 如果只有三位的值，需变成六位，如：#fff => #ffffff
            if (color.length === 4) {
                let colorNew = "#";
                for (let i = 1; i < 4; i += 1) {
                    colorNew += color.slice(i, i + 1).concat(color.slice(i, i + 1));
                }
                color = colorNew;
            }
            // 处理六位的颜色值，转为RGB
            let colorChange = [];
            for (let i = 1; i < 7; i += 2) {
                colorChange.push(parseInt("0x" + color.slice(i, i + 2)));
            }
            return colorChange;
        } else {
            return null;
        }
    },
    /**
     * 颜色RGB数组转换为16进制格式
     * @param {string} value RGB格式的。例如rgb(12,12,12)
     * @returns {string} 返回16进制格式
     */
    colorHex: function (value) {
        // RGB颜色值的正则
        let reg = /^(rgb|RGB)/;
        let color = value;
        if (reg.test(color)) {
            let strHex = "#";
            // 把RGB的3个数值变成数组
            let colorArr = color.replace(/(?:\(|\)|rgb|RGB)*/g, "").split(",");
            // 转成16进制
            for (let i = 0; i < colorArr.length; i++) {
                let hex = Number(colorArr[i]).toString(16);
                if (hex === "0") {
                    hex += hex;
                }
                strHex += hex;
            }
            return strHex;
        } else {
            return color;
        }
    }
};
