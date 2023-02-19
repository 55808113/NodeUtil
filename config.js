/**
读取和写json文件
 let config = Config('config.json', () => {
	// Main Controller
	botController = BotController(config)	
})
*/
const jsonfile = require('jsonfile')

let Config = (file, callback) => {
    let c = {}

    c.data = {}
    c.save = (cb) => {
        jsonfile.writeFile(file, c.data,  {spaces: 2, EOL: '\r\n'}, function (err) {
          console.error(err)
          if(cb!=undefined) cb()
        })
    }

    let open = (cb) => {
        jsonfile.readFile(file, (err, o) => {
            c.data = o
            if(cb!=undefined) cb()
        })
    }
    open(callback)

    return c
}
module.exports = Config