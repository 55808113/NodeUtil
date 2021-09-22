/*
字符串转换函数
 */
const debug = require('debug')('demo:server');
const http = require('http');
module.exports = {
    //端口
    _port: "3000",
    //服务端口
    serverPort: function () {
        function normalizePort(val) {
            let port = parseInt(val, 10);

            if (isNaN(port)) {
                // named pipe
                return val;
            }

            if (port >= 0) {
                // port number
                return port;
            }

            return false;
        }

        return normalizePort(process.env.PORT || this._port);
    },
    //创建服务
    createServer: function (app) {
        function onError(error) {
            if (error.syscall !== 'listen') {
                throw error;
            }

            let bind = typeof this._port === 'string'
                ? 'Pipe ' + "3000"
                : 'Port ' + "3000";

            // handle specific listen errors with friendly messages
            switch (error.code) {
                case 'EACCES':
                    console.error(bind + ' requires elevated privileges');
                    process.exit(1);
                    break;
                case 'EADDRINUSE':
                    console.error(bind + ' is already in use');
                    process.exit(1);
                    break;
                default:
                    throw error;
            }
        }

        /**
         * Event listener for HTTP server "listening" event.
         */
        function onListening() {
            let addr = this.address();
            let bind = typeof addr === 'string'
                ? 'pipe ' + addr
                : 'port ' + addr.port;
            debug('Listening on ' + bind);
        }

        let server = http.createServer(app.callback());
        //websocket服务，因为已经有统一的websocket服务了。不用在这里添加了！===============================


        /**
         * Listen on provided port, on all network interfaces.
         */


        server.listen(this.serverPort());
        server.on('error', onError);
        server.on('listening', onListening);
        return server;
    }
};
