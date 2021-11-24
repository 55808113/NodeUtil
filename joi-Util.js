
/**
 认证数据
 例子：
 在message里添加
 , validate: joi.string().min(6).max(10).required().label("用户id")

 const joiUtil = $joiUtil($message.sysuser);
 joiUtil.validate(param)
 */
const joi = require('joi')
const _ = require('lodash')
/**
 * joi.string()/joi.number()：定义只能是字符串/数字类型
 * joi.alphanum()：只能是字母字符串或者数字字符串
 * joi.min()/max()：限制字符串最大最小长度
 * joi.required()：此属性必填
 * joi.error()：自定义错误信息
 * joi.regex()：接收一个字符串规则验证
 * [joi.string(), joi.number()]：可以时字符串也可以是数字类型
 * joi.integer()：必须是整数
 */
let joiUtil = function(messageObjs) {
    if (!(this instanceof joiUtil)) {
        return new joiUtil(messageObjs);
    }
    let joiObject = null
    let schema = {}
    for(let key in messageObjs){
        let messageObj = messageObjs[key]
        let messageValidate = messageObj.validate
        if (!_.isNil(messageValidate)){
            schema[key] = messageValidate
        }
    }
    if (!_.isEmpty(schema)){
        joiObject = joi.object(schema)
    }

    let messages = _.assign({}, {
        'string.email': '{{#label}} 必须为email格式',
        'string.isoDate': '{{#label}} 必须为iso格式',
        'string.length': '{{#label}} 必须为 {{#limit}} 的字符长度',
        'string.lowercase': '{{#label}} 必须为小写格式',
        'string.max': '{{#label}} 必须小于等于 {{#limit}} 的字符长度',
        'string.min': '{{#label}} 必须至少 {{#limit}} 的字符长度',
        'string.uppercase': '{{#label}} 必须为大写格式'
    }, {
        'number.base': '{{#label}} 必须为数字格式',
        'number.integer': '{{#label}} 必须为整数',
        'number.less': '{{#label}} 必须小于 {{#limit}}',
        'number.max': '{{#label}} 必须小于或者等于 {{#limit}}',
        'number.min': '{{#label}} 必须大于或者等于 {{#limit}}',
        'number.negative': '{{#label}} 必须为负数'
    }, {
        'date.base': '{{#label}} 必须是日期格式',
        'date.greater': '{{#label}} 必须大于 {{:#limit}}',
        'date.less': '{{#label}} 必须小于 {{:#limit}}',
        'date.max': '{{#label}} 必须小于或者等于 {{:#limit}}',
        'date.min': '{{#label}} 必须大于或者等于 {{:#limit}}'
    }, {
        'binary.base': '{{#label}} 必须为流或者字符串',
        'binary.length': '{{#label}} 长度必须 {{#limit}} bytes',
        'binary.max': '{{#label}} 必须小于或者等于 {{#limit}} bytes',
        'binary.min': '{{#label}} 必须大于 {{#limit}} bytes'
    }, {
        'boolean.base': '{{#label}} 必须为boolean类型'
    })


    /**
     * 验证数据
     * @param data
     *  validate(param,$message.sysuser)
     */
    this.validate = function (data) {
        if (!_.isNull(joiObject)){
            const { error, value } = joiObject.validate(data, {
                allowUnknown: true,
                abortEarly: false,
                messages: messages
            });
            if(error) {
                console.log(error.message)
                throw new Error(error.message)
            }
        }
    }
};
module.exports = joiUtil