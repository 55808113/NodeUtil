/**
 * 邮件服务
 */
const _ = require('lodash')
const nodemailer = require('nodemailer');

class mail {
    _transporter = null
    options = {
        service:'QQ',
        user:'55808113@qq.com',
        pass:'xxxxxxxxx' //邮箱第三方登录授权码
    }
    init (opts){
        _.assign(this.options,opts)
    }
    /**
     * 初始化
     */
    _createTransporter () {
        let opts = this.options
        this._transporter = nodemailer.createTransport({
            service: opts.service,
            auth: {
                user: opts.user,//发送者邮箱
                pass: opts.pass //邮箱第三方登录授权码
            },
            debug: true
        }, {
            from: opts.user,//发送者邮箱
            headers: {
                'X-Laziness-level': 1000
            }
        });
    }
    /**
     * 发送邮件
     * @param {json} message 发送的信息：
     * @example
     例子：var message = {
         // Comma separated lsit of recipients 收件人用逗号间隔
         to: '12xxxx101@qq.com',
         // Subject of the message 信息主题
         subject:  'Nodemailer is unicode friendly',
         // plaintext body
         text: 'Hello to myself~',
         // Html body
         html: '<p><b>Hello</b> to myself <img src= "cid:00001"/></p>' +
             '<p>Here\'s a nyan car for you as embedded attachment:<br/><img src="cid:00002"/></p>',
         // Apple Watch specific HTML body 苹果手表指定HTML格式
         watchHtml: '<b>Hello</b> to myself',
         // An array of attachments 附件
         attachments: [
             // String attachment
             {
                 filename: 'notes.txt',
                 content: 'Some notes about this e-mail',
                 contentType: 'text/plain' // optional,would be detected from the filename 可选的，会检测文件名
             },
             // Binary Buffer attchment
             {
                 filename: 'image.png',
                 content: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAABAAAAAQAQMAAAAlPW0iAAAABlBMVEUAAAD/' +
                    '//+l2Z/dAAAAM0lEQVR4nGP4/5/h/1+G/58ZDrAz3D/McH8yw83NDDeNGe4U' +
                    'g9C9zwz3gVLMDA/A6P9/AFGGFyjOXZtQAAAAAElFTkSuQmCC', 'base64'),
                 cid: '00001'  // should be as unique as possible 尽可能唯一
             },
             // File Stream attachment
             {
                 filename: 'nyan cat.gif',
                 path: __dirname + '/appData/nyan.gif',
                 cid: '00002'  // should be as unique as possible 尽可能唯一
              }
         ]
     };
     * @returns {*}
     */
    sendMail (message) {
        return new Promise(async (resolve, reject) => {
            if (!this._transporter) this._createTransporter()
            let transporter = this._transporter
            transporter.sendMail(message, (error, info) => {
                if (error) {
                    reject(error)
                    return;
                }
                console.log('Message sent successfully!');
                console.log('Server responded with "%s"', info.response);
                transporter.close();
                resolve(info.response)
            });
        })
    }
};

module.exports = new mail()