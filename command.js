/*
调用命令的通用函数
 */
const _ = require('lodash')
const util = require('util');
const childprocess = require('child_process');
const iconv = require('iconv-lite');
const $util = require('./util')
const $convert = require('./convert')
const _linux = (process.platform === 'linux');
const _darwin = (process.platform === 'darwin');
const _windows = (process.platform === 'win32');

const execOptsWin = {
    windowsHide: true,
    maxBuffer: 1024 * 20000,
    encoding: 'UTF-8',
    env: util._extend({}, process.env, {LANG: 'en_US.UTF-8'})
};
let wmicPath = '';
let codepage = '';
module.exports = {
    /**
     * 根据命令行返回的列表数据，再根据属性名称得到属性值
     * @param {array} lines 命令行返回的列表数据
     * @param {string} property 属性名称
     * @param {string} separator 分割的字符串
     * @param {string} trimmed 是否去空格
     * @returns {string|*}
     */
    getValue: function (lines, property, separator, trimmed) {
        separator = separator || ':';
        property = property.toLowerCase();
        trimmed = trimmed || false;
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].toLowerCase().replace(/\t/g, '');
            if (trimmed) {
                line = line.trim();
            }
            if (line.startsWith(property)) {
                const parts = lines[i].split(separator);
                if (parts.length >= 2) {
                    parts.shift();
                    return parts.join(separator).trim();
                } else {
                    return '';
                }
            }
        }
        return '';
    },
    /**
     * 根据不同的系统返回wmic命令
     * @returns {string|string|*}
     */
    getWmic: function () {

        if (os.type() === 'Windows_NT' && !wmicPath) {
            wmicPath = process.env.WINDIR + '\\system32\\wbem\\wmic.exe';
            if (!fs.existsSync(wmicPath)) {
                try {
                    const wmicPathArray = execSync('WHERE WMIC').toString().split('\r\n');
                    if (wmicPathArray && wmicPathArray.length) {
                        wmicPath = wmicPathArray[0];
                    } else {
                        wmicPath = 'wmic';
                    }
                } catch (e) {
                    wmicPath = 'wmic';
                }
            }
        }
        return wmicPath;
    },
    /**
     * 执行wmic命令
     * @param {string} command 命令的语句
     * @param {object} options 命令的参数
     * @returns {Promise<unknown>}
     */
    wmic: function (command, options) {
        options = options || execOptsWin;
        options.encoding = 'buffer'
        return new Promise((resolve) => {
            process.nextTick(() => {
                try {
                    childprocess.exec(this.getWmic() + ' ' + command, options, function (error, stdout) {
                        resolve(iconv.decode(stdout, 'cp936'), error);
                    }).stdin.end();
                } catch (e) {
                    resolve('', e);
                }
            });
        });
    },
    /**
     * 得到系统的编码
     * @returns {string|*} 返回系统的编码
     */
    getCodepage: function () {
        if (_windows) {
            if (!codepage) {
                try {
                    const stdout = execSync('chcp');
                    const lines = stdout.toString().split('\r\n');
                    const parts = lines[0].split(':');
                    codepage = parts.length > 1 ? parts[1].replace('.', '') : '';
                } catch (err) {
                    codepage = '437';
                }
            }
            return codepage;
        }
        if (_linux || _darwin || _freebsd || _openbsd || _netbsd) {
            if (!codepage) {
                try {
                    const stdout = execSync('echo $LANG');
                    const lines = stdout.toString().split('\r\n');
                    const parts = lines[0].split('.');
                    codepage = parts.length > 1 ? parts[1].trim() : '';
                    if (!codepage) {
                        codepage = 'UTF-8';
                    }
                } catch (err) {
                    codepage = 'UTF-8';
                }
            }
            return codepage;
        }
    },
    /**
     * window执行命令行命令
     * @param {string} cmd
     * @param {object} opts
     * @param {function} callback 返回的参数
     */
    execWin: function (cmd, opts, callback) {
        if (!callback) {
            callback = opts;
            opts = execOptsWin;
        }
        let newCmd = 'chcp 65001 > nul && cmd /C ' + cmd + ' && chcp ' + this.getCodepage() + ' > nul';
        childprocess.exec(newCmd, opts, function (error, stdout) {
            callback(error, stdout);
        });
    },
    /**
     * 执行powerShell语句
     * @param {string} cmd 命令语句
     * @returns {Promise<unknown>}
     */
    powerShell: function (cmd) {
        let result = '';
        return new Promise((resolve) => {
            process.nextTick(() => {
                try {
                    const child = childprocess.spawn('powershell.exe', ['-NoLogo', '-InputFormat', 'Text', '-NoExit', '-ExecutionPolicy', 'Unrestricted', '-Command', '-'], {
                        stdio: 'pipe'
                    });

                    if (child && !child.pid) {
                        child.on('error', function () {
                            resolve(result);
                        });
                    }
                    if (child && child.pid) {
                        child.stdout.on('data', function (data) {
                            result = result + data.toString('utf8');
                        });
                        child.stderr.on('data', function () {
                            child.kill();
                            resolve(result);
                        });
                        child.on('close', function () {
                            child.kill();
                            resolve(result);
                        });
                        child.on('error', function () {
                            child.kill();
                            resolve(result);
                        });
                        try {
                            child.stdin.write(cmd + os.EOL);
                            child.stdin.write('exit' + os.EOL);
                            child.stdin.end();
                        } catch (e) {
                            child.kill();
                            resolve(result);
                        }
                    } else {
                        resolve(result);
                    }
                } catch (e) {
                    resolve(result);
                }
            });
        });
    },
    /**
     * 得到当前CPU温度。只有lINUX好使。
     * @returns {Promise<number>} CPU温度
     */
    CPU_Temp: async function () {
        if (_windows) {
            return $util.randomNum(35, 45)
        } else {
            const exec = util.promisify(childprocess.exec);
            const {stdout, stderr} = await exec('vcgencmd measure_temp');
            return $convert.getNumber(stdout.replace("temp=", "").replace("'C\n", ""))
        }
    },
    /**
     * 开始Mjpg_streamer视频监控服务
     * @returns {Promise<void>}
     */
    startMjpg_streamer: function () {
        if (_windows) return
        let pid = this.PIDbyName("mjpg_streamer")
        if (!_.isNull(pid)) return
        let opt = {
            //图片的大小
            //imgSize: "1280x720",
            imgSize: "480x320",
            //每秒的帧数
            frames: 9,
            //清楚度
            clarity: 80,
            //端口
            port: "8080"
        }
        let child = childprocess.spawn('mjpg_streamer',
            [
                '-i "/usr/local/lib/mjpg-streamer/input_uvc.so -n -f ' + opt.frames + ' -r ' + opt.imgSize + ' -q ' + opt.clarity + '"',
                '-o "/usr/local/lib/mjpg-streamer/output_http.so -p ' + opt.port + ' -w /usr/local/share/mjpg-streamer/www"'
            ],
            {
                shell: true,
                stdio: 'inherit',
                //设置为true创建一个新的session和进程组,node退出进程也不退出
                //detached: false
            }
        );
    },
    /**
     * 通过进程名称得到PID
     * @param name 进程名称
     * @returns {*} 返回PID
     * @constructor
     */
    PIDbyName: function (name) {
        if (_windows) {
            let datas = iconv.decode(childprocess.execSync('tasklist /fi "IMAGENAME eq ' + name + '" /NH', {encoding: 'buffer'}), 'cp936').toString()
            if (datas.indexOf("信息") != -1) return null
            //切割以空格（多个空格）
            let dataArr = datas.split(/\s+/)
            return dataArr[2]
        } else {
            let result = null
            try {
                result = childprocess.execSync('pidof ' + name)
            } catch (err) {

            }
            console.log(`PID:${result}`)
            return $convert.getNumber(result, null)
        }
    },
    /**
     * 从网上下载文件
     * @param url {string} 网上文件的路径
     * @param filepath {string} 文件保存的路径
     */
    urlDownload: function (url, filepath) {
        childprocess.exec('wget -O ' + filepath + ' ' + url, function (error, stdout, stderr) {
            if (error) {
                throw error;
            } else {
                console.log(`tdout:${stdout}`);
            }
        });
    }
}