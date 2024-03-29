
const $command = require('./command')
/**
 * 判断的函数
 */
class check {
    /**
     * 判断字符是否为函数
     * @param {function} functionToCheck
     * @returns {boolean}
     */
    checkIsFunction(functionToCheck) {
        let getType = {};
        return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
    }
    /**
     * 判断身份证号码
     * @param {Object} num
     * @returns {boolean|string}
     */
    checkIsIDCardNum (num){
        num = num.toUpperCase();
        //身份证号码为15位或者18位，15位时全为数字，18位前17位为数字，最后一位是校验位，可能为数字或字符X。
        if (!(/(^\d{15}$)|(^\d{17}([0-9]|X)$)/.test(num))) {
            return '输入的身份证号长度不对，或者号码不符合规定！\n15位号码应全为数字，18位号码末位可以为数字或X。';
        }
        //校验位按照ISO 7064:1983.MOD 11-2的规定生成，X可以认为是数字10。
        //下面分别分析出生日期和校验位
        let len, re;
        len = num.length;
        if (len == 15) {
            re = new RegExp(/^(\d{6})(\d{2})(\d{2})(\d{2})(\d{3})$/);
            let arrSplit = num.match(re);

            //检查生日日期是否正确
            let dtmBirth = new Date('19' + arrSplit[2] + '/' + arrSplit[3] + '/' + arrSplit[4]);
            let bGoodDay;
            bGoodDay = (dtmBirth.getYear() == Number(arrSplit[2])) && ((dtmBirth.getMonth() + 1) == Number(arrSplit[3])) && (dtmBirth.getDate() == Number(arrSplit[4]));
            if (!bGoodDay) {
                return '输入的身份证号里出生日期不对！';
            } else {
                //将15位身份证转成18位
                //校验位按照ISO 7064:1983.MOD 11-2的规定生成，X可以认为是数字10。
                let arrInt = new Array(7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2);
                let arrCh = new Array('1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2');
                let nTemp = 0,
                    i;
                num = num.substr(0, 6) + '19' + num.substr(6, num.length - 6);
                for (i = 0; i < 17; i++) {
                    nTemp += num.substr(i, 1) * arrInt[i];
                }
                num += arrCh[nTemp % 11];
                return true;
            }
        }
        if (len == 18) {
            re = new RegExp(/^(\d{6})(\d{4})(\d{2})(\d{2})(\d{3})([0-9]|X)$/);
            let arrSplit = num.match(re);

            //检查生日日期是否正确
            let dtmBirth = new Date(arrSplit[2] + "/" + arrSplit[3] + "/" + arrSplit[4]);
            let bGoodDay;
            bGoodDay = (dtmBirth.getFullYear() == Number(arrSplit[2])) && ((dtmBirth.getMonth() + 1) == Number(arrSplit[3])) && (dtmBirth.getDate() == Number(arrSplit[4]));
            if (!bGoodDay) {
                return '输入的身份证号里出生日期不对！';
            } else {
                //检验18位身份证的校验码是否正确。
                //校验位按照ISO 7064:1983.MOD 11-2的规定生成，X可以认为是数字10。
                let valnum;
                let arrInt = new Array(7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2);
                let arrCh = new Array('1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2');
                let nTemp = 0,
                    i;
                for (i = 0; i < 17; i++) {
                    nTemp += num.substr(i, 1) * arrInt[i];
                }
                valnum = arrCh[nTemp % 11];
                if (valnum != num.substr(17, 1)) {
                    //$("#tip").html('18位身份证的校验码不正确！应该为：' + valnum);
                    return '18位身份证的校验码不正确！';
                }
                return true;
            }
        }
        return '18位身份证的校验码不正确！';
    }
    /**
     * 判断系统是不是树莓派
     * @returns {*|boolean}
     */
    checkIsRaspberry () {
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
    }
    /**
     * 检查是否为Raspbian系统
     * @returns {*|boolean}
     */
    checkIsRaspbian () {
        let osrelease = [];
        try {
            osrelease = fs.readFileSync('/etc/os-release', {encoding: 'utf8'}).split('\n');
        } catch (e) {
            return false;
        }
        const id = $command.getValue(osrelease, 'id');
        return (id && id.indexOf('raspbian') > -1);
    }
    /**
     * 检验浏览器是否为PC
     */
    checkIsPC (ctx){
        if (!ctx.request.headers["user-agent"]) return true;
        let deviceAgent = ctx.request.headers["user-agent"].toLowerCase();
        let agentID = deviceAgent.match(/(iphone|ipod|ipad|android)/);
        if(agentID){
            //    请求来自手机、pad等移动端
            return false;
        }else{
            //    请求来自PC
            return true;
        }
    }
}

module.exports = new check()