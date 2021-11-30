/*
调用C写的函数库的
 */
const _ = require('lodash')
const path = require('path')
const _linux = (process.platform === 'linux');
const _darwin = (process.platform === 'darwin');
const _windows = (process.platform === 'win32');
const ffi = _windows ? null : require('ffi')
const ref = _windows ? null : require('ref')

/**
 * 串口通信
 * @param {string} device 串口的地址，在Linux中就是设备所在的目录。默认一般是"/dev/ttyAMA0"
 * @param {int} baud 波特率
 * @returns {Serial} 返回对象
 * @constructor
 */
let Serial = function(device= "/dev/ttyACM0", baud= 9600){
    if (!(this instanceof Serial)) {
        return new Serial(device, baud);
    }
    let _Library = ffi.Library(path.join(process.cwd(), '/lib/Serial'), {
        'init': [ref.types.int, [ref.types.CString, ref.types.int]],
        'close': [ref.types.void, []],
        'writeChar': [ref.types.void, [ref.types.byte]],
        'writeStr': [ref.types.void, [ref.types.CString]],
        'readChar': [ref.types.char, []],
        'readStr': [ref.types.CString, []]
    })
    let status = false
    if (_Library) {
        if (_Library.init(device, baud) >= 0) {
            status = true
        }
    }
    /**
     * 是否加载成功
     * @returns {boolean}
     */
    this.getStatus = function () {
        return status
    }
    /**
     * 关闭串口
     */
    this.close = function () {
        if (!status) return;
        _Library.close();
    }
    /**
     * 写串口char数据
     * @param {char} val 数据
     */
    this.writeChar = function (val) {
        if (!status) return;
        _Library.writeChar(val);
    }
    /**
     * 写串口字符串
     * @param {string} val 数据
     */
    this.writeStr = function (val) {
        if (!status) return;
        _Library.writeStr(val);
    }
    /**
     * 读数据
     * @returns {undefined|*} 返回读取的数据
     */
    this.readChar = function () {
        if (!status) return;
        return _Library.readChar();
    }

    this.readStr = function () {
        if (!status) return;
        return _Library.readStr();
    }

    this.dataAvail = function () {
        if (!status) return;
        return _Library.dataAvail();
    }
}
/**
 * 开关类库
 * @param {uint8} pin wiringpi的端口 pin：(只有1,23,24,26 为pwm)
 * @param {uint8} mode 为0代表OUTPUT，为1代表INPUT
 * @returns {HighLow}
 * @constructor
 */
let HighLow = function (pin, mode) {
    if (!(this instanceof HighLow)) {
        return new HighLow(pin, mode);
    }
    let _Library = ffi.Library(path.join(process.cwd(), '/lib/HighLow'), {
        'init': [ref.types.int, [ref.types.uint8, ref.types.uint8]],
        'pullUpDn': [ref.types.void, [ref.types.uint8]],
        'writeHigh': [ref.types.void, []],
        'writeLow': [ref.types.void, []],
        'read': [ref.types.int, []],
        'writePwm': [ref.types.void, [ref.types.int]]
    })
    let status = false
    if (_Library) {
        if (_Library.init(pin, mode) >= 0) {
            status = true
        }
    }
    /**
     * 输入引脚设置拉电阻模式
     * @param {uint8} pud 0代表PUD_OFF，1代表PUD_DOWN，2代表PUD_UP，
     */
    this.pullUpDn = function (pud) {
        if (!status) return;
        _Library.pullUpDn(pud);
    }
    /**
     * 是否加载成功
     * @returns {boolean}
     */
    this.getStatus = function () {
        return status
    }
    /**
     * 输出高电压
     */
    this.writeHigh = function () {
        if (!status) return;
        _Library.writeHigh();
    }
    /**
     * 输出低电压
     */
    this.writeLow = function () {
        if (!status) return;
        _Library.writeLow();
    }
    /**
     * 输入读取
     * @returns {int}
     */
    this.read = function () {
        if (!status) return -1;
        return _Library.read();
    }
    /**
     * 输出pwm
     * @param pwm {int}
     */
    this.writePwm = function (pwm) {
        if (!status) return;
        _Library.writePwm(pwm);
    }
}

/**
 * LCD1602类库
 * @returns {LCD1602}
 * @constructor
 */
let LCD1602 = function () {
    if (!(this instanceof LCD1602)) {
        return new LCD1602();
    }
    let _Library = ffi.Library(path.join(process.cwd(), '/lib/LCD1602'), {
        'init': [ref.types.int, []],
        'clear': [ref.types.void, []],
        'write': [ref.types.void, [ref.types.int, ref.types.int, ref.types.CString]]
    });
    let status = false
    if (_Library) {
        if (_Library.init() >= 0) {
            status = true
        }
    }
    /**
     * 是否加载成功
     * @returns {boolean}
     */
    this.getStatus = function () {
        return status
    }

    /**
     * 清空屏幕
     */
    this.clear = function () {
        if (!status) return;
        _Library.clear();
    }

    /**
     * 写信息
     * @param {int} x X位置
     * @param {int} y Y位置（0-1）
     * @param {string} data 显示的字符串
     */
    this.write = function (x, y, data) {
        if (!status) return;
        _Library.write(x, y, data);
    }
}

/**
 * PID算法
 * @param {float} speed 设定速度
 * @param {float} umin 速度最小值
 * @param {float} umax 速度最大值
 * @returns {PID}
 * @constructor
 */
let PID = function (speed, umin, umax) {
    if (!(this instanceof PID)) {
        return new PID(speed, umin, umax);
    }
    let _Library = ffi.Library(path.join(process.cwd(), '/lib/PID'), {
        'PID_Init': [ref.types.void, [ref.types.float, ref.types.float, ref.types.float]],
        'PID_Reset': [ref.types.void, []],
        'PID_Loc': [ref.types.float, [ref.types.float]],
        'PID_Inc': [ref.types.float, [ref.types.float]]
    });
    let status = false
    if (_Library) {
        _Library.PID_Init(speed, umin, umax)
        status = true
    }
    /**
     * 是否加载成功
     * @returns {boolean}
     */
    this.getStatus = function () {
        return status
    }
    /**
     * 初始化
     * @param {float} speed 设定速度
     * @param {float} umin 速度最小值
     * @param {float} umax 速度最大值
     * @constructor
     */
    this.PID_Init = function (speed, umin, umax) {
        if (!status) return
        _Library.PID_Init(speed, umin, umax)
    }
    /**
     * PID初始化
     * @constructor
     */
    this.PID_Reset = function () {
        if (!status) return
        _Library.PID_Reset()
    }
    /**
     * PID位置(Location)计算
     * @param {float} actualSpeed 实际值速度值(反馈值)
     * @returns {number|*} 返回计算后的实际速度值
     * @constructor
     */
    this.PID_Loc = function (actualSpeed) {
        if (!status) return actualSpeed
        return _Library.PID_Loc(actualSpeed)
    }
    /**
     * PID增量(Increment)计算
     * @param {float} actualSpeed 实际值速度值(反馈值)
     * @returns {number|*} 返回计算后的增量速度值
     * @constructor
     */
    this.PID_Inc = function (actualSpeed) {
        if (!status) return 0
        return _Library.PID_Inc(actualSpeed)
    }
}

/**
 * 舵机控制类库
 * @returns {PWMServoDriver}
 * @constructor
 */
let PWMServoDriver = function () {
    if (!(this instanceof PWMServoDriver)) {
        return new PWMServoDriver();
    }
    let _Library = ffi.Library(path.join(process.cwd(), '/lib/PWMServoDriver'), {
        'init': [ref.types.int, []],
        'setPinAngle': [ref.types.void, [ref.types.uint8, ref.types.float]]
    });
    let status = false
    if (_Library) {
        if (_Library.init() >= 0) {
            status = true
        }
    }
    /**
     * 是否加载成功
     * @returns {boolean}
     */
    this.getStatus = function () {
        return status
    }
    /**
     * 设置那个舵机角度
     * @param {uint8_t} num 舵机号
     * @param {float} angle 角度（0-180）
     */
    this.setPinAngle = function (num, angle) {
        if (!status) return;
        _Library.setPinAngle(num, angle);
    }
}
/**
 * 控制舵机类
 * @param {uint8_t} sclk 默认0
 * @param {uint8_t} din 默认1
 * @param {uint8_t} dc 默认2
 * @param {uint8_t} cs 默认3
 * @param {uint8_t} rst 默认4
 * @param {uint8_t} contrast 清晰度：默认50就行了
 * @returns {PCD8544}
 * @constructor
 */
let PCD8544 = function (sclk = 0, din = 1, dc = 2, cs = 3, rst = 4, contrast = 50) {
    if (!(this instanceof PCD8544)) {
        return new PCD8544(sclk, din, dc, cs, rst, contrast);
    }
    let _Library = ffi.Library(path.join(process.cwd(), '/lib/PCD8544'), {

        'LCDInit': [ref.types.int, [ref.types.uint8, ref.types.uint8, ref.types.uint8, ref.types.uint8, ref.types.uint8, ref.types.uint8]],
        'LCDclear': [ref.types.void, []],
        'LCDshowLogo': [ref.types.void, []],
        'LCDdrawstring': [ref.types.void, [ref.types.uint8, ref.types.uint8, ref.types.CString]],
        'LCDdrawline': [ref.types.void, [ref.types.uint8, ref.types.uint8, ref.types.uint8, ref.types.uint8, ref.types.uint8]],
        'LCDsetPixel': [ref.types.void, [ref.types.uint8, ref.types.uint8, ref.types.uint8]],
        'LCDdrawchar': [ref.types.void, [ref.types.uint8, ref.types.uint8, ref.types.char]],
        'LCDfillrect': [ref.types.void, [ref.types.uint8, ref.types.uint8, ref.types.uint8, ref.types.uint8, ref.types.uint8]],
        'LCDdrawrect': [ref.types.void, [ref.types.uint8, ref.types.uint8, ref.types.uint8, ref.types.uint8, ref.types.uint8]],
        'LCDdrawcircle': [ref.types.void, [ref.types.uint8, ref.types.uint8, ref.types.uint8, ref.types.uint8]],
        'LCDfillcircle': [ref.types.void, [ref.types.uint8, ref.types.uint8, ref.types.uint8, ref.types.uint8]],
        //显示
        'LCDdisplay': [ref.types.void, []]
    });
    let status = false
    if (_Library) {
        if (_Library.LCDInit(sclk, din, dc, cs, rst, contrast) >= 0) {
            status = true
        }
    }
    /**
     * 是否加载成功
     * @returns {boolean}
     */
    this.getStatus = function () {
        return status
    }
    /**
     * 清空屏幕
     * @constructor
     */
    this.LCDclear = function () {
        if (!status) return;
        _Library.LCDclear();
    }
    /**
     * 显示logo
     * @constructor
     */
    this.LCDshowLogo = function () {
        if (!status) return;
        _Library.LCDshowLogo();
    }
    /**
     * 显示字符串
     * @param {uint8_t} x X位置
     * @param {uint8_t} line Y位置
     * @param {string} data 显示的字符串
     * @constructor
     */
    this.LCDdrawstring = function (x, line, data) {
        if (!status) return;
        _Library.LCDdrawstring(x, line, data);
    }
    /**
     * 画线
     * @param {uint8_t} x0 x0位置
     * @param {uint8_t} y0 y0位置
     * @param {uint8_t} x1 x1位置
     * @param {uint8_t} y1 y1位置
     * @param {uint8_t} color 颜色（1代表黑色，0代表白色，默认1）
     * @constructor
     */
    this.LCDdrawline = function (x0, y0, x1, y1, color = 1) {
        if (!status) return;
        _Library.LCDdrawline(x0, y0, x1, y1, color);
    }
    /**
     * 画点
     * @param {uint8_t} x x位置
     * @param {uint8_t} y y位置
     * @param {uint8_t} color 颜色（1代表黑色，0代表白色，默认1）
     * @constructor
     */
    this.LCDsetPixel = function (x, y, color = 1) {
        if (!status) return;
        _Library.LCDsetPixel(x, y, color);
    }
    /**
     * 画符号
     * @param {uint8_t} x x位置
     * @param {uint8_t} line y位置
     * @param {char} c 符号序号（0-127）
     * @constructor
     */
    this.LCDdrawchar = function (x, line, c) {
        if (!status) return;
        _Library.LCDdrawchar(x, line, c);
    }
    /**
     * 画实心矩形
     * @param {uint8_t} x x位置
     * @param {uint8_t} y y位置
     * @param {uint8_t} w w宽度
     * @param {uint8_t} h h高度
     * @param {uint8_t} color 颜色（1代表黑色，0代表白色，默认1）
     * @constructor
     */
    this.LCDfillrect = function (x, y, w, h, color = 1) {
        if (!status) return;
        _Library.LCDfillrect(x, y, w, h, color);
    }
    /**
     * 画空心矩形
     * @param {uint8_t} x x位置
     * @param {uint8_t} y y位置
     * @param {uint8_t} w w宽度
     * @param {uint8_t} h h高度
     * @param {uint8_t} color 颜色（1代表黑色，0代表白色，默认1）
     * @constructor
     */
    this.LCDdrawrect = function (x, y, w, h, color = 1) {
        if (!status) return;
        _Library.LCDdrawrect(x, y, w, h, color);
    }
    /**
     * 画空心圆
     * @param {uint8_t} x0 x位置
     * @param {uint8_t} y0 y位置
     * @param {uint8_t} r r半径
     * @param {uint8_t} color 颜色（1代表黑色，0代表白色，默认1）
     * @constructor
     */
    this.LCDdrawcircle = function (x0, y0, r, color = 1) {
        if (!status) return;
        _Library.LCDdrawcircle(x0, y0, r, color);
    }
    /**
     * 画实心圆
     * @param {uint8_t} x0 x位置
     * @param {uint8_t} y0 y位置
     * @param {uint8_t} r r半径
     * @param {uint8_t} color 颜色（1代表黑色，0代表白色，默认1）
     * @constructor
     */
    this.LCDfillcircle = function (x0, y0, r, color = 1) {
        if (!status) return;
        _Library.LCDfillcircle(x0, y0, r, color);
    }
    /**
     * 显示
     * @constructor
     */
    this.LCDdisplay = function () {
        if (!status) return;
        _Library.LCDdisplay();
    }
}
/**
 * 对128*64的显示的驱动
 * @returns {SSD1306}
 * @constructor
 */
let SSD1306 = function () {
    if (!(this instanceof SSD1306)) {
        return new SSD1306();
    }
    let _Library = ffi.Library(path.join(process.cwd(), '/lib/SSD1306_i2c'), {
        'ssd1306_begin': [ref.types.int, []],
        'ssd1306_clearDisplay': [ref.types.void, []],
        'ssd1306_invertDisplay': [ref.types.void, [ref.types.uint8]],
        'ssd1306_display': [ref.types.void, []],
        'ssd1306_startscrollright': [ref.types.void, [ref.types.uint16, ref.types.uint16]],
        'ssd1306_startscrollleft': [ref.types.void, [ref.types.uint16, ref.types.uint16]],
        'ssd1306_startscrolldiagright': [ref.types.void, [ref.types.uint16, ref.types.uint16]],
        'ssd1306_startscrolldiagleft': [ref.types.void, [ref.types.uint16, ref.types.uint16]],
        'ssd1306_stopscroll': [ref.types.void, []],
        'ssd1306_dim': [ref.types.void, [ref.types.uint8]],
        'ssd1306_drawPixel': [ref.types.void, [ref.types.int, ref.types.int, ref.types.uint16]],
        'ssd1306_drawFastVLine': [ref.types.void, [ref.types.int, ref.types.int, ref.types.uint16, ref.types.uint16]],
        'ssd1306_drawFastHLine': [ref.types.void, [ref.types.int, ref.types.int, ref.types.uint16, ref.types.uint16]],
        'ssd1306_fillRect': [ref.types.void, [ref.types.int, ref.types.int, ref.types.uint16, ref.types.uint16, ref.types.uint16]],
        'ssd1306_setTextSize': [ref.types.void, [ref.types.uint16]],
        'ssd1306_drawString': [ref.types.void, [ref.types.int, ref.types.int, ref.types.CString]],
        'ssd1306_drawChar': [ref.types.void, [ref.types.int, ref.types.int, ref.types.uint8, ref.types.uint16, ref.types.uint16]],
    });
    let status = false
    if (_Library) {
        if (_Library.ssd1306_begin() >= 0) {
            status = true
        }
    }
    /**
     * 是否加载成功
     * @returns {boolean}
     */
    this.getStatus = function () {
        return status
    }
    /**
     * 清空显示
     */
    this.clearDisplay = function () {
        if (!status) return;
        _Library.ssd1306_clearDisplay();
    }
    /**
     * 是否颠倒显示
     * @param {uint8_t} i 1:为颠倒显示。0:为正常显示
     */
    this.invertDisplay = function (i) {
        if (!status) return;
        _Library.ssd1306_invertDisplay(i);
    }
    /**
     * 显示
     */
    this.display = function () {
        if (!status) return;
        _Library.ssd1306_display();
    }
    /**
     * 开始向右滚动
     * @param {uint16_t} start
     * @param {uint16_t} stop
     */
    this.startscrollright = function (start, stop) {
        if (!status) return;
        _Library.ssd1306_startscrollright(start, stop);
    }
    /**
     * 开始向左滚动
     * @param {uint16_t} start
     * @param {uint16_t} stop
     */
    this.startscrollleft = function (start, stop) {
        if (!status) return;
        _Library.ssd1306_startscrollleft(start, stop);
    }
    /**
     * 开始向右滚动
     * @param {uint16_t} start
     * @param {uint16_t} stop
     */
    this.startscrolldiagright = function (start, stop) {
        if (!status) return;
        _Library.ssd1306_startscrolldiagright(start, stop);
    }
    /**
     * 开始向左滚动
     * @param {uint16_t} start
     * @param {uint16_t} stop
     */
    this.startscrolldiagleft = function (start, stop) {
        if (!status) return;
        _Library.ssd1306_startscrolldiagleft(start, stop);
    }
    /**
     * 停止滚动
     */
    this.stopscroll = function () {
        if (!status) return;
        _Library.ssd1306_stopscroll();
    }
    /**
     * 是否渐变
     * @param {uint8_t} dim 1:为渐变显示。0:为正常显示
     */
    this.dim = function (dim) {
        if (!status) return;
        _Library.ssd1306_dim(dim);
    }
    /**
     * 画点
     * @param {int} x x坐标
     * @param {int} y y坐标
     * @param {uint16_t} color 颜色
     */
    this.drawPixel = function (x, y, color) {
        if (!status) return;
        _Library.ssd1306_drawPixel(x, y, color);
    }
    /**
     * 画竖线
     * @param {int} x x坐标
     * @param {int} y y坐标
     * @param {uint16_t} h 高度
     * @param {uint16_t} color 颜色
     */
    this.drawFastVLine = function (x, y, h, color) {
        if (!status) return;
        _Library.ssd1306_drawFastVLine(x, y, h, color);
    }
    /**
     * 画横线
     * @param {int} x x坐标
     * @param {int} y y坐标
     * @param {uint16_t} w 宽度
     * @param {uint16_t} color 颜色
     */
    this.drawFastHLine = function (x, y, w, color) {
        if (!status) return;
        _Library.ssd1306_drawFastHLine(x, y, w, color);
    }
    /**
     * 画矩形
     * @param {int} x x坐标
     * @param {int} y y坐标
     * @param {uint16_t} w 宽度
     * @param {uint16_t} h 高度
     * @param {uint16_t} fillcolor 填充颜色
     */
    this.fillRect = function (x, y, w, h, fillcolor) {
        if (!status) return;
        _Library.ssd1306_fillRect(x, y, w, h, fillcolor);
    }
    /**
     * 建立文字大小
     * @param {uint16_t} s 文字大小
     */
    this.setTextSize = function (s) {
        if (!status) return;
        _Library.ssd1306_setTextSize(s);
    }
    /**
     * 画文字串
     * @param {int} x x坐标
     * @param {int} y y坐标
     * @param {string} str 字符串
     */
    this.drawString = function (x, y, str) {
        if (!status) return;
        _Library.ssd1306_drawString(x, y, str);
    }
    /**
     * 画字符
     * @param {int} x x坐标
     * @param {int} y y坐标
     * @param {uint8_t} c 字节
     * @param {uint16_t} color 颜色
     * @param {uint16_t} size 文字大小
     */
    this.drawChar = function (x, y, c, color, size) {
        if (!status) return;
        _Library.ssd1306_drawChar(x, y, c, color, size);
    }
}
exports.HighLow = HighLow;
exports.LCD1602 = LCD1602;
exports.PWMServoDriver = PWMServoDriver;
exports.PCD8544 = PCD8544;
exports.PID = PID;
exports.Serial = Serial;
exports.SSD1306 = SSD1306;