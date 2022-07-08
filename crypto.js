
const CryptoJS = require("crypto-js")
const AESkey = "www.sunxdd.com"
const AESvi = "abcdefg123456"
//const MD5key = "www.sunxdd.com"
const SHA256key = "www.sunxdd.com"
/**
 常用的加密解密方法
 */
module.exports = {
    /**
     * MD5加密
     * @param {string} str 要加密的字符串
     * @returns {*} 返回加密后的字符串
     * @constructor
     */
    MD5: (str) => {
        return CryptoJS.MD5(str).toString();
    },
    /**
     * AES加密
     */
    AES: {
        /**
         * AES加密
         * @param {string} message 要加密的字符串
         * @returns {string} 加密后字符串
         */
        encrypt: (message) => {//加密
            return CryptoJS.AES.encrypt(message, AESkey, {
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7,
                iv: AESvi
            }).toString();
        },
        /**
         * AES解密
         * @param {string} encrypt 要解密的字符串
         * @returns {string} 解密后的字符串
         */
        decrypt: (encrypt) => {//解密
            return CryptoJS.AES.decrypt(encrypt, AESkey, {
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7,
                iv: AESvi
            }).toString(CryptoJS.enc.Utf8);
        }
    },
    /**
     * DES加密。这个可以实现每次加密都是一样的结果。
     */
    DES: {
        /**
         * AES加密
         * @param {string} message 要加密的字符串
         * @returns {string} 加密后字符串
         */
        encrypt: (message) => {//加密
            return CryptoJS.DES.encrypt(message, CryptoJS.enc.Utf8.parse(AESkey), {
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7,
                iv: CryptoJS.enc.Utf8.parse(AESvi)
            }).toString();
        },
        /**
         * AES解密
         * @param {string} encrypt 要解密的字符串
         * @returns {string} 解密后的字符串
         */
        decrypt: (encrypt) => {//解密
            return CryptoJS.DES.decrypt(encrypt, CryptoJS.enc.Utf8.parse(AESkey), {
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7,
                iv: CryptoJS.enc.Utf8.parse(AESvi)
            }).toString(CryptoJS.enc.Utf8);
        }
    },
    Base64: {
        /**
         *
         * @param message
         * @returns {string}
         */
        stringify: (message) => {
            let base64Str = Buffer.from(message, "utf8").toString('base64');
            return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Base64.parse(base64Str));
        }
    },
    SHA: {
        /**
         * SHA加密
         * @param message
         * @returns {*}
         * @constructor
         */
        SHA1: (message) => {
            return CryptoJS.SHA1(message).toString();
        },
        /**
         * SHA256加密
         * @param message
         * @param type
         * @returns {string}
         * @constructor
         */
        HmacSHA256: (message, type = "base64") => {
            let signature = CryptoJS.HmacSHA256(message, SHA256key).toString();
            if (type.toLowerCase() == "base64") {
                return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(signature))
            } else {
                return signature
            }
        },
    },
};
