/**
 百度ai
 例子：
 // 刷新验证码

 */
const AipFaceClient = require("baidu-aip-sdk").face
const AipBodyAnalysisClient = require("baidu-aip-sdk").bodyanalysis;
const AipSpeechClient = require("baidu-aip-sdk").speech;
const $util = require('./util')
// 设置APPID/AK/SK
const APP_ID = "xxxxxxxx";
const API_KEY = "xxxxxxxxxxxxxxxx";
const SECRET_KEY = "xxxxxxxxxxxxxxxxxxxx";
/**
 * 人脸模块
 * @returns {face}
 */
let face = function () {
    if (!(this instanceof face)) {
        return new face();
    }
    let _client = new AipFaceClient(APP_ID, API_KEY, SECRET_KEY)
    /**
     * 人脸识别
     * @param {string} image 图片BASE64字符串
     * @returns {Promise<json>} json字符串
     */
    this.detect = function (image) {
        // 如果有可选参数
        let options = {
            "face_field": "age",
            "max_face_num": "10",
            "face_type": "LIVE",
            "liveness_control": "LOW"
        }
        return new Promise((resolve, reject) => {
            _client.detect(image, "BASE64", options).then(function (result) {
                console.log(JSON.stringify(result));
                resolve(result)
            }).catch(function (err) {
                // 如果发生网络错误
                reject(new Error('[baidu失败!]:' + err))
            })
        })
    }
}
/**
 * 人体相关
 * @returns {bodyAnalysis}
 */
let bodyAnalysis = function () {
    if (!(this instanceof bodyAnalysis)) {
        return new bodyAnalysis();
    }
    let _client = new AipBodyAnalysisClient(APP_ID, API_KEY, SECRET_KEY)
    /**
     * 人体检测
     * @param {string} image 图片BASE64字符串
     * @returns {Promise<json>} json字符串
     */
    this.bodyAttr = function (image) {
        // 如果有可选参数
        let options = {
            //"type":"gender"
        }
        return new Promise((resolve, reject) => {
            _client.bodyAttr(image, options).then(function (result) {
                console.log(JSON.stringify(result));
                resolve(result)
            }).catch(function (err) {
                // 如果发生网络错误
                reject(new Error('[baidu失败!]:' + err))
            })
        })
    }
    /**
     * 手势识别
     * @param image
     * @returns {Promise<unknown>}
     */
    this.gesture = function (image) {
        // 如果有可选参数
        let options = {
            //"type":"gender"
        }
        return new Promise((resolve, reject) => {
            _client.gesture(image, options).then(function (result) {
                console.log(JSON.stringify(result));
                resolve(result)
            }).catch(function (err) {
                // 如果发生网络错误
                reject(new Error('[baidu失败!]:' + err))
            })
        })
    }
}
let speech = function () {
    if (!(this instanceof speech)) {
        return new speech();
    }
    let _client = new AipSpeechClient(APP_ID, API_KEY, SECRET_KEY)
    /**
     * 识别本地文件
     * @param {buffer} voiceBuffer 声音流
     * @returns {Promise<json>} json字符串
     */
    this.recognize = function (voiceBuffer) {
        // 如果有可选参数
        let options = {}
        return new Promise((resolve, reject) => {
            _client.recognize(voiceBuffer, 'pcm', 16000, options).then(function (result) {
                console.log(JSON.stringify(result));
                resolve(result)
            }).catch(function (err) {
                // 如果发生网络错误
                reject(new Error('[baidu失败!]:' + err))
            })
        })
    }
    /**
     * 语音合成
     * @param {string} voiceText 语音文本
     * @returns {Promise<unknown>}
     */
    this.text2audio = function (voiceText) {
        // 如果有可选参数
        let options = {}
        return new Promise((resolve, reject) => {
            _client.text2audio(voiceText, options).then(function (result) {
                if (result.data) {
                    resolve(result.data)
                } else {
                    // 服务发生错误
                    console.log(result)
                }
            }).catch(function (err) {
                // 如果发生网络错误
                reject(new Error('[baidu失败!]:' + err))
            })
        })
    }
}
exports.face = face;
exports.bodyAnalysis = bodyAnalysis;
exports.speech = speech;