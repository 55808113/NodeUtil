/**
 PID算法
 例子：

 */
module.exports = {
    _pid: {
        //设定速度
        SetSpeed: 0.0,
        //最大的偏差值
        err_max: 0.0,
        //定义偏差值
        err: 0.0,
        //上一个偏差值
        err_last: 0.0,
        //下一个偏差值
        err_next: 0.0,
        //p,i,d系数
        Kp: 0.0, Ki: 0.0, Kd: 0.0,
        //积分值,即积分部分的累计值
        //抗积分饱和
        integral: 0.0,
        //震荡最大值和最小值
        umax: 0.0,
        umin: 0.0
    },
    /**
     *
     * @param {float} speed
     * @param {float} umin
     * @param {float} umax
     * @constructor
     */
    PID_Init: function (speed, umin, umax) {
        this._pid.SetSpeed = speed;
        this._pid.umax = umax;
        this._pid.umin = umin;
        this.PID_Reset();
    },
    /**
     * 初始化参数
     * @constructor
     */
    PID_Reset: function () {
        //pid.ActualSpeed = 0;
        this._pid.err = 0.0;
        this._pid.err_last = 0.0;
        this._pid.err_next = 0.0;
        this._pid.err_max = 200;
        this._pid.integral = 0.0;
        //pid.voltage = 0;
        this._pid.Kp = 0.1;
        this._pid.Ki = 0.15;
        this._pid.Kd = 0.1;
    },
    /**
     * PID位置(Location)计算
     * @param actualSpeed
     * @returns {number}
     * @constructor
     */
    PID_Loc: function (actualSpeed) {
        let index;
        //pid.SetSpeed = speed;
        this._pid.err = this._pid.SetSpeed - actualSpeed;

        //抗积分饱和过程
        if (actualSpeed > this._pid.umax) {
            if (Math.abs(this._pid.err) > this._pid.err_max) {
                index = 0;
            } else {
                index = 1;
                if (this._pid.err < 0) {    //向反向积分
                    this._pid.integral += this._pid.err;
                }
            }
        } else if (actualSpeed < this._pid.umin) {
            if (Math.abs(this._pid.err) > this._pid.err_max) {
                index = 0;
            } else {
                index = 1;
                if (this._pid.err < 0) {
                    this._pid.integral += this._pid.err;
                }
            }
        } else {
            if (Math.abs(this._pid.err) > this._pid.err_max) {
                index = 0;
            } else {
                index = 1;
                this._pid.integral += this._pid.err;
            }
        }
        let voltage = this._pid.Kp * this._pid.err + index * this._pid.Ki * this._pid.integral + this._pid.Kd * (this._pid.err - this._pid.err_last);
        this._pid.err_last = this._pid.err;
        return voltage * 1.0;
    },
    /**
     * PID增量(Increment)计算
     * @param actualSpeed
     * @returns {number}
     * @constructor
     */
    PID_Inc: function (actualSpeed) {
        //let index;
        //pid.SetSpeed = speed;
        this._pid.err = this._pid.SetSpeed - actualSpeed;

        let incrementSpeed = this._pid.Kp * (this._pid.err - this._pid.err_next) + this._pid.Ki * this._pid.err + this._pid.Kd * (this._pid.err - 2 * this._pid.err_next + this._pid.err_last);
        this._pid.err_last = this._pid.err_next;
        this._pid.err_next = this._pid.err;
        return incrementSpeed;
    }
};
