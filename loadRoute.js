/**
 * 动态遍历目录加载路由工具
 * author: bling兴哥
 */
const fs = require("fs");
// 动态路由
/**
 * 动态路由
 */
var loadRoute = {
    path: './routes/',
    app: null,
    /**
     * 遍历目录
     * @param dir 目录
     */
    listDir: function (dir) {
        let fileList = fs.readdirSync(dir);
        for (let i = 0; i < fileList.length; i++) {
            let stat = fs.lstatSync(dir + fileList[i]);
            // 是目录，需要继续
            if (stat.isDirectory()) {
                this.listDir(dir + fileList[i] + '/');
            } else {
                this.loadRoute(dir + fileList[i]);
            }
        }
    },
    /**
     * 加载路由
     * @param {string} routeFile
     */
    loadRoute: function (routeFile) {
        console.log(routeFile);
        let routername = "." + routeFile.substring(0, routeFile.lastIndexOf('.'));
        let router = require(routername);
        // 在路由文件中定义了一个basePath变量，设置路由路径前缀
        this.app.use(router.routes(), router.allowedMethods())
    },
    // 初始化入口
    init: function (app, path) {
        if (!app) {
            console.error("系统主参数App未设置");
            return false;
        }
        this.app = app;
        this.path = path ? path : this.path;
        this.listDir(this.path);
    }
};

module.exports = loadRoute;