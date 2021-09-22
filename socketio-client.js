/**
 * websocket客户端函数
 * 例子：let socketClent = new $socketClient()
 * socketClent.sendMessage("","")
 */
const $server = require('./server');
const ioclient = require('socket.io-client');

let socketClient = function () {
    if (!(this instanceof socketClient)) {
        return new socketClient();
    }
    const socket = ioclient.connect('ws://localhost:' + $server._port, {reconnect: true});
    socket.on('connect', function () {
        console.log('Connected!');
    });
    /**
     * 发送信息
     * @param {string} name 名称
     * @param {string} msg 信息
     */
    this.sendMessage = function (name, msg) {
        socket.emit(name, msg);
    }
}
module.exports = socketClient;