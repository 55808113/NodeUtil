
const dayjs = require('dayjs');
const _ = require('lodash')
const $util = require('./util')
/**
 相关转换函数
 */
class convert {
    /**
     * 向前台返回JSON方法的简单封装
     * @param {string|boolean|number} val 值
     * @param {boolean} defaultvalue 默认值
     * @returns {boolean}
     */
    getBool (val, defaultvalue = false) {
        if ($util.isEmpty(val))
            return defaultvalue
        else if (val === true || _.lowerCase(val) === "true" || val === 1 || val === "1" || val === "是")
            return true
        else
            return false
    }
    /**
     * 数据库bool转换为number
     * @param val
     * @param defaultvalue
     * @returns {number}
     */
    getBoolNumber (val, defaultvalue = 0) {
        var result = defaultvalue
        if(this.getBool(val)){
            result = 1
        }
        return result
    }
    /**
     * 得到对象
     * @param {object} val 值
     * @returns {string|number|null|*}
     */
    getObject (val) {
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
    }
    /**
     * 得到字符类型
     * @param {string} val 值
     * @param {string} defaultvalue 默认值
     * @returns {string|*}
     */
    getString (val, defaultvalue = "") {
        if ($util.isEmpty(val))
            return defaultvalue;
        else
            return val.toString();
    }
    /**
     * 得到日期类型
     * @param {Date} val 值
     * @param {Date} defaultvalue 默认值
     * @returns {Date|null|*}
     */
    getDate (val, defaultvalue = null) {
        if (!dayjs(val).isValid())
            return defaultvalue;
        else{
            return new Date(val);
        }
    }
    /**
     * MsSql数据库的得到日期类型
     * @param {string|number} val 值
     * @param {string} defaultvalue 默认值
     * @returns {string|null|*}
     */
    getDate_MsSql (val, defaultvalue = null) {
        let result = defaultvalue
        if (_.isNumber(val)){
            result = this.excelDateToString(val)
        }else{
            if (dayjs(val).isValid()){
                result = val;
            }
        }
        return result
    }
    /**
     * MsSql数据库的得到时间类型
     * @param {string|number} val 值
     * @param {string} defaultvalue 默认值
     * @returns {string|null|*}
     */
    getDateTime_MsSql (val, defaultvalue = null) {
        let result = defaultvalue
        if (_.isNumber(val)){
            result = this.excelDateTimeToString(val)
        }else{
            if (dayjs(val).isValid()){
                result = val;
            }
        }
        return result
    }
    /**
     * 转换json的日期。因为有2023-01-01T00:10:11有T所以要去掉T
     * @param val
     * @param defaultvalue
     * @returns {null|Date}
     */
    getJsonDate (val, defaultvalue = null) {
        if ($util.isEmpty(val)){
            return defaultvalue;
        }else{
            let arr;
            if (val.indexOf("T") != -1) {
                arr = val.split("T");
            } else {
                //nodejs时日期格式是2012-11-11 11:11:11
                arr = val.split(" ");
            }
            return arr[0];
        }
    }
    /**
     * 转换json的日期时间格式。因为有2023-01-01T00:10:11有T所以要去掉T
     * @param val
     * @param defaultvalue
     * @returns {null|Date}
     */
    getJsonDateTime (val, defaultvalue = null) {
        if ($util.isEmpty(val))
            return defaultvalue;
        else
            return val.replace('T', ' ');
    }
    /**
     * 得到数字。如果为空根据默认值返回
     * @param {number} val 值
     * @param {number} [defaultvalue] 默认值
     * @returns {number}
     */
    getNumber (val, defaultvalue = 0) {
        if ($util.isEmpty(val) || _.isNaN(Number(val)))
            return defaultvalue;
        else
            return Number(val);

    }
    /**
     * 格式化日期加时间
     * @param {Date} val 值
     * @param {string} template 格式
     * @returns {string}
     */
    getDateTimeString (val, template = "YYYY-MM-DD HH:mm:ss") {
        //千万不要修改为_.isEmpty(val)因为这个函数无法判断日期
        if (!_.isDate(val))
            return "";
        else
            return dayjs(val).format(template);
    }
    /**
     * 格式化日期格式
     * @param {Date} val 值
     * @param {string} template
     * @returns {string}
     */
    getDateString (val, template = "YYYY-MM-DD") {
        //千万不要修改为_.isEmpty(val)因为这个函数无法判断日期
        return this.getDateTimeString(val, template);
    }

    /**
     * 得到MS毫秒转换为分和小时的格式：xxMS xx秒 xx分
     * @param val
     */
    getDateMSString(val){
        let sizes = ['ms','s','min','h'];
        if ($util.isEmpty(val)) return 'n/a';
        let result = ""
        let i = parseInt(Math.floor(Math.log(val) / Math.log(1000)));
        val = (val / Math.pow(1000, i)).toFixed(0)
        if (i==0){
            result = val + ' ' + sizes[0];
        }else{
            i = parseInt(Math.floor(Math.log(val) / Math.log(60)));
            result = (val / Math.pow(60, i)).toFixed(1) + ' ' + sizes[i+1];
        }
        return result;
    }
    /**
     * 字符串转成数组
     * @param {string} str 数组字符串
     * @param {string} [sn] 分割的字符串
     * @returns {*|Array|string[]} 返回的数组
     */
    strToArray (str, sn = ',') {
        let result = []
        if ($util.isNotEmpty(str)) {
            result = str.split(sn); // 在每个逗号(,)处进行分解。
        }
        return result

    }
    /**
     * 数组转成字符串
     * @param {object[]|string} arr
     * @param {string} [sn]
     * @returns {string} 返回的字符串
     */
    arrayToStr (arr, sn = ','){
        let result = "";
        if (Array.isArray(arr)) {
            result = arr.join(sn)
        } else {
            result = arr
        }
        return result
    }
    /**
     * 前台传过来的数组有时是字符串有时是数组。所以通过转换成统一的数组
     * 当选择一个时是string。多个时才是array类型
     * @param {object|object[]} arr
     * @returns {object[]}
     */
    paramsToArr (arr){
        let result = []
        if ($util.isNotEmpty(arr)) {
            if (_.isArray(arr)) {
                for (let value of arr) {
                    if ($util.isNotEmpty(value)) {
                        result.push(value)
                    }
                }
            } else {
                result = _.split(arr,',')
            }
        }
        return result
    }
    /**
     * 字符串转json类型
     * @param {string|Object} str 要转换的字符串
     * @returns {JSON|null} 返回JSON对象
     */
    strToJson (str) {
        //如果是对象直接返回
        if (str instanceof Object){
            return str
        }
        if (!$util.isEmpty(str) && str != 0) {
            try {
                return JSON.parse(str);
            }catch (err){

            }
        }
        return null;
    }
    /**
     * json类型转字符串
     * @param {JSON} json json对象
     * @returns {string} 字符串
     */
    jsonToStr(json) {
        if (!_.isEmpty(json)) {
            return JSON.stringify(json);
        }
    }
    /**
     * 过滤html标签
     * @param {string} str 要过滤的html
     * @returns {string|*} 过滤后的字符串
     */
    delhtmltags (str) {
        if (!$util.isEmpty(str)) {
            return str.replace(/<[^>]+>/g, ''); // 去掉所有的html标记
        } else {
            return '';
        }
    }
    /**
     * 等比取值
     * @param {number} value
     * @param {number} fromLow
     * @param {number} fromHigh
     * @param {number} toLow
     * @param {number} toHigh
     * @returns {number|*}
     */
    map (value, fromLow, fromHigh, toLow, toHigh) {
        return (value - fromLow) * (toHigh - toLow) / (fromHigh - fromLow) + toLow;
    }
    /**
     * 颜色16进制格式转换为RGB数组
     * @param {string} value 16进制格式的。例如#FFFFFF
     * @returns {array} 返回RGB数组
     * @example
     * let rgb = colorRgb("#FFFFFF")
     * rgb //[255,255,255]
     */
    colorRgb (value) {
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
    }
    /**
     * 颜色RGB数组转换为16进制格式
     * @param {string} value RGB格式的。例如rgb(12,12,12)
     * @returns {string} 返回16进制格式
     * @example
     * let hex = colorHex("rgb(12,12,12)")
     * hex //#FFFFFF
     */
    colorHex (value) {
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

    /**
     *
     * @param numb
     * @returns {Date}
     * @private
     */
    _getTime(value){
        //return new Date( (numb - 25567) * 24 * 3600000  - 5 * 60 * 1000 - 43 * 1000 - 24 * 6 * 60 * 1000 - 8 * 3600000 )
        return new Date(((Number(value) - 70 * 365 - 19) * 24 * 3600 + 0.5 - 8 * 3600) * 1000)
    }
    /**
     * 因为excel日期返回的是数字。所以需要转换
     * @param {number} numb 日期的数字值
     * @returns {string}
     */
    excelDateToString(value) {
        if (!_.isNumber(value)){
            return value
        }
        const time = this._getTime(value)
        return this.getDateString(time)
    }
    /**
     * 因为excel时间返回的是数字。所以需要转换
     * @param {number} numb 日期的数字值
     * @returns {string}
     */
    excelDateTimeToString(value) {
        if (!_.isNumber(value)){
            return value
        }
        const time = this._getTime(value)
        return this.getDateTimeString(time)
    }
};

module.exports = new convert()
