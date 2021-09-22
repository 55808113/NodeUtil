/*
认证码
例子：
// 刷新验证码
function refreshCode() {
    //获取当前的时间作为参数，无具体意义
    var timenow = new Date().getTime();
    $.ajax({
        type: "get",
        dataType: "json",
        url: "/?ajax=code&width=" + $("#img_code").width() + "&height=" + $("#img_code").height() +"&id=" + timenow,
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
//生成svg图片的类
const svgCaptcha = require('svg-captcha')

module.exports = {
    /**
     * 得到认证码
     * @param ctx
     * @param {int} width 认证码宽度 默认60
     * @param {int} height 认证码高度 默认25
     */
    getCode: function (ctx, width = 60, height = 25) {
        let outputBuffer;
        // 验证码，对了有两个属性，text是字符，data是svg代码
        let code = svgCaptcha.create({
            // 翻转颜色
            inverse: false,
            // 验证码字符中排除 0o1i
            //ignoreChars: '0o1il',
            //验证码字符
            charPreset: 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnopqrstuvwxyz23456789',
            // 字体大小
            fontSize: 25,
            // 噪声线条数
            noise: 0,
            // 宽度
            width: width,
            // 高度
            height: height
        });
        // 保存到session,忽略大小写
        ctx.session.randomcode = code.text.toLowerCase();
        let ieVerison = ctx.req.headers["user-agent"];
        if (ieVerison.indexOf("Mozilla/4.0") == -1 && ieVerison.indexOf("Mozilla/3.0") == -1 && ieVerison.indexOf("Mozilla/2.0") == -1) {
            ctx.set('Content-Type', 'image/svg+xml');
            outputBuffer = String(code.data);
        } else {
            ctx.set('Content-Type', 'image/png');
            //outputBuffer = svg2png.sync(code.data, { width: width, height: height });
        }
        // 返回数据直接放入页面元素展示即可
        ctx.body = {
            statusCode: 500,
            data: outputBuffer
        };
        /*ctx.body = outputBuffer;*/
    }
};
