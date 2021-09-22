/**
 * 根据目录动态生成路由
 * author:
 */
const compose = require('koa-compose')
const path = require('path')
const $file = require('./file')
const a = require("../index")
//根据目录得到所有的文件。
//const globby = require('globby')
function registerRouter() {
    /**
     * 遍历目录
     * @param dir 目录
     */
    const dirpath = '../../routes/'
    let files = $file.findFile(path.join(__dirname, dirpath))
    /*(async () => {
        let paths = await globby(__dirname+'routes')
        for (let path of paths) {
            let router = require('../../' + path)
            routers.push(router.routes())
            routers.push(router.allowedMethods())
            console.log(path);
        }
    })();*/
    let routers = [];
    for (let file of files) {
        let routerpath = path.join(dirpath, file.replace(path.join(__dirname, dirpath), ""))
        let router = require(routerpath)
        routers.push(router.routes())
        routers.push(router.allowedMethods())
        console.log(routerpath);
    }
    return compose(routers)
}

module.exports = registerRouter