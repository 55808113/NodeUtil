/**
 * 判断的语句
 例子：
 */
const $command = require('./command')
module.exports = {
    /**
     * 判断字符是否为函数
     * @param functionToCheck
     * @returns {boolean}
     */
    checkIsFunction: function (functionToCheck) {
        let getType = {};
        return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
    },
    /**
     * 判断系统是不是树莓派
     * @returns {*|boolean}
     */
    checkIsRaspberry: function () {
        const PI_MODEL_NO = [
            'BCM2708',
            'BCM2709',
            'BCM2710',
            'BCM2835',
            'BCM2837B0'
        ];
        let cpuinfo = [];
        try {
            cpuinfo = fs.readFileSync('/proc/cpuinfo', {encoding: 'utf8'}).split('\n');
        } catch (e) {
            return false;
        }
        const hardware = getValue(cpuinfo, 'hardware');
        return (hardware && PI_MODEL_NO.indexOf(hardware) > -1);
    },
    /**
     * 检查是否为Raspbian系统
     * @returns {*|boolean}
     */
    checkIsRaspbian: function () {
        let osrelease = [];
        try {
            osrelease = fs.readFileSync('/etc/os-release', {encoding: 'utf8'}).split('\n');
        } catch (e) {
            return false;
        }
        const id = $command.getValue(osrelease, 'id');
        return (id && id.indexOf('raspbian') > -1);
    },
    /**
     * 检验浏览器是否为PC
     */
    checkIsPC: function (ctx){
        var deviceAgent = ctx.request.headers["user-agent"].toLowerCase();
        var agentID = deviceAgent.match(/(iphone|ipod|ipad|android)/);
        if(agentID){
            //    请求来自手机、pad等移动端
            return false;
        }else{
            //    请求来自PC
            return true;
        }
    }
}