/**
 认证码
 例子：
 // 刷新验证码
 function refreshCode() {
    //获取当前的时间作为参数，无具体意义
    var timenow = new Date().getTime();
    $.ajax({
        type: "get",
        dataType: "json",
        url: "/index_code?width=" + $("#img_code").width() + "&height=" + $("#img_code").height() +"&id=" + timenow,
        success: function (msg) {
            $("#img_code").css('display', 'block');
            $("#img_code").attr('src', msg.data);

        }
    });
}
 $("#img_code").click(function () {
    refreshCode();
})
 */
const canvas = require('canvas')
const $util = require('./util')
const $convert = require('./convert')
module.exports = {
    /**
     * 得到认证码
     * @param ctx
     * @param {int} width 认证码宽度 默认100
     * @param {int} height 认证码高度 默认30
     */
    getCode: function (ctx, width = 100, height = 30) {
        let defalut = {
            width: $convert.getNumber(width), //认证码的宽度
            height: $convert.getNumber(height), // 认证码的高度
            bgColor_min: 180, //背景颜色最小值
            bgColor_max: 250, //背景颜色最大值
            fontColor_min: 50, //文字颜色最小值
            fontColor_max: 160, //文字颜色最大值
            font: 'bold 20px arial', //文字字体
            fontSize: 10, //文字大小
            trans: {c: [-0.108, 0.108], b: [-0.05, 0.05]},
            str: 'abcdefghjkmnpqrstuvwxyz23456789',
            length: 4, //个数
            noiseLine: 4, //干扰线数
            noisePoint: 50 //干扰点数
        }

        let canva = canvas.createCanvas(defalut.width, defalut.height);
        let ctx2d = canva.getContext('2d');
        // ctx.textBaseline = 'bottom';
        //** 绘制背景色 **//        
        ctx2d.fillStyle = $util.randomColor(defalut.bgColor_min, defalut.bgColor_max);
        ctx2d.fillRect(0, 0, defalut.width, defalut.height);
        let code = "";

        //** 绘制文字 **//

        let dist = Math.floor(defalut.width / (defalut.length) - defalut.fontSize)
        let start = Math.floor(dist / 2)
        for (var i = 0; i < defalut.length; i++) {
            let txt = defalut.str[$util.randomNum(0, defalut.str.length)];
            code += txt;
            ctx2d.font = defalut.font;
            ctx2d.fillStyle = $util.randomColor(defalut.fontColor_min, defalut.fontColor_max);
            ctx2d.fillText(txt, start, defalut.height - defalut.fontSize, defalut.fontSize);
            ctx2d.fillRect();
            let c = $util.getRandom(defalut.trans['c'][0], defalut.trans['c'][1]);
            let b = $util.getRandom(defalut.trans['b'][0], defalut.trans['b'][1]);
            ctx2d.transform(1, b, c, 1, 0, 0);
            start += dist + defalut.fontSize;
        }

        //*** 绘制干扰线 ***//
        for (var i = 0; i < defalut.noiseLine; i++) {
            ctx2d.strokeStyle = $util.randomColor(40, 180);
            ctx2d.beginPath();
            ctx2d.moveTo($util.randomNum(0, defalut.width), $util.randomNum(0, defalut.height));
            ctx2d.lineTo($util.randomNum(0, defalut.width), $util.randomNum(0, defalut.height));
            ctx2d.stroke();
        }
        // ** 绘制干扰点 ** //
        for (var i = 0; i < defalut.noisePoint; i++) {
            ctx2d.fillStyle = $util.randomColor(0, 255);
            ctx2d.beginPath();
            ctx2d.arc($util.randomNum(0, defalut.width), $util.randomNum(0, defalut.height), 1, 0, 2 * Math.PI);
            ctx2d.fill();
        }
        //result.code = code;
        // 保存到session 用来验证
        ctx.session.randomcode = code;
        ctx.body = {
            statusCode: 500,
            data: canva.toDataURL()
        };
    }
};
