/**
 * redis服务器的客户端
 * */

const redis = require('ioredis')
//常用的js函数类
const _ = require('lodash')
const $log4js = require('./log4js')

module.exports = {
    /**
     * {RedisClient}
     */
    client: null,
    /**
     * 能否使用
     */
    enable:false,
    /**
     * Create a new Client instance.
     * @param {object|string} config Configuration or connection string for new MySQL connections
     * @public
     */
    createClient: function (config){
        this.enable = config.enable
        if (!config.enable) return;
        this.client = new redis(config)
        this.client.on('ready', function (res) {
            console.log('ready');
        });

        this.client.on('end', function (err) {
            console.log('end！');
        });

        this.client.on('error', function (err) {
            $log4js.errLogger(null, err)
        });

        this.client.on('connect', function () {
            console.log('redis connect success!');
        });
    },
    /**
     * 设置对象
     * @param {string} key 键的名称
     * @param {string} val 字段值
     * @param {int} maxAge 秒单位
     * @returns {boolean}
     */
    set:async function (key, val, maxAge = 60 * 60 * 24, ex = 'EX') {
        let self = this
        if (!this.client) return;
        if (typeof val === 'object') {
            val = JSON.stringify(val)
        }
        if (self.client.status!="ready") return null

        await this.client.set(key, val,ex, maxAge)

        return true
    },
    /**
     * 得到json对象
     * @param {string} key 键的名称
     * @returns {Promise<unknown>|null}
     */
    get: async function (key) {
        let self = this
        if (!this.client||self.client.status!="ready") return null;
        let result = await self.client.get(key)
        if (result != null && typeof result === 'string') {
            try {
                result = JSON.parse(result)
            } catch (error) {

            }
        }
        return result;
    },
    /**
     * 删除表中的数据
     * @param {string} key 键的名称
     * @returns {boolean}
     */
    del:async function (key) {
        let self = this;
        if (!this.client || self.client.status!="ready") return null;
        await self.client.del(key)
        return true
    },
    /*设置对象
     key:表的名称
     field:字段名称
     val:字段值
     */
    /**
     * 设置对象
     * @param {string} key 键的名称
     * @param {string} field 字段名称
     * @param val 字段值
     * @returns {boolean}
     */
    hset: async function (key, field, val) {
        let self = this;
        if (!this.client||self.client.status!="ready") return null;
        if (typeof val === 'object') {
            val = JSON.stringify(val)
        }
        await self.client.hset(key, field, val)
        return true
    },
    /**
     * 得到json对象
     * @param {string} key 键的名称
     * @param {string} field 字段名称
     * @returns {Promise<unknown>|null}
     */
    hget:async function (key, field) {
        let self = this;
        if (!this.client||self.client.status!="ready") return null;
        let result = await self.client.hget(key, field)
        if (result != null && typeof result === 'string') {
            try {
                result = JSON.parse(result)
            } catch (error) {

            }
        }
        return result;
    },
    /**
     * 通过fidld得到json对象数组
     * @param {string} key 键的名称
     * @param {object[]} fields 字段名称
     * @returns {Promise<unknown>|null}
     */
    hmget:async function (key, fields) {
        let self = this;
        if (!this.client||self.client.status!="ready") return null;
        let result = []
        let rows = await self.client.hmget(key, fields)
        if (rows != null) {
            for (let row of rows) {
                //当没有找到数据会返回null。要把null去掉
                if (row==null) continue
                try {
                    result.push(JSON.parse(row))
                } catch (error) {
                    result.push(row)
                }
            }

        }
        return result;
    },
    /**
     * 得到所有key的数组
     * @param key
     * @returns {Promise<*|null>}
     */
    hgetall:async function (key) {
        let self = this;
        if (!this.client||self.client.status!="ready") return null;
        let result = []
        let rows = await self.client.hgetall(key)
        if (rows != null) {
            for (let key in rows) {
                let row = rows[key]
                try {
                    result.push(JSON.parse(row))
                } catch (error) {
                    result.push(row)
                }
            }

        }
        return result;
    },
    /**
     * 删除表中的数据
     * @param {string} key 表的名称
     * @param {string} field 字段名称
     * @returns {boolean}
     */
    hdel:async function (key, field) {
        let self = this;
        if (!this.client||self.client.status!="ready") return;
        await self.client.hdel(key, field)
        return true
    },
    /**
     * 设置过期时间
     * @param {string} key 键的名称
     * @param {int} maxAge 秒单位 60 * 60 * 24一天
     * @param ex
     * @returns {boolean}
     */
    expire:async function (key, maxAge = 60 * 60 * 24) {
        let self = this;
        if (!this.client||self.client.status!="ready") return;
        await self.client.expire(key,maxAge);
    },
    /**
     * 判断key是否存在
     * @param key
     * @returns {Promise<boolean>} 1:成功 0:失败
     */
    exists:async function (key) {
        let self = this;
        let result = false;

        if (!this.client||self.client.status!="ready") return;
        if (await self.client.exists(key)){
            result = true
        }
        return result
    },
    /**
     * 清空所有数据库的key
     * @param key
     * @returns {Promise<boolean>}
     */
    flushall:async function () {
        let self = this;
        if (!this.client||self.client.status!="ready") return;
        await self.client.flushall()
    },

    /**
     * 判断key和field是否存在
     * @param key
     * @returns {Promise<boolean>}
     */
    hexists:async function (key,field) {
        let self = this;
        let result = false;
        if (!this.client||self.client.status!="ready") return null;
        if (await self.client.hexists(key,field)){
            result = true
        }
        return result
    },
    /**
     * 列表 向redis中插入整个数组，其数组中为多条string类型的json数据
     * @param {string} key
     * @param list
     * @returns {boolean}
     */
    setList: function (key, list) {//添加整个数组
        let self = this;
        if (!this.client) return;
        for (let i = 0; i < list.length; i++) {
            if ((typeof list[i]) === "object") {
                list[i] = JSON.stringify(list[i])
            }
        }
        self.client.lpush(key, list[0]);
        for (let i = 1; i < list.length; i++) {
            self.client.rpush(key, list[i])
        }
        //cb(null,"set success");
        return true;
    },
    /**
     * 向表中插入单条数据
     * @param key
     * @param value
     * @returns {Promise<unknown>}
     */
    pushList: function (key, value) {//添加单个数据
        let self = this;
        if (!this.client) return;
        return new Promise((resolve, reject) => {
            //当没有启动服务时，返回Null
            if (self.client.status!="ready") {
                resolve(null)
                return
            }
            self.client.rpush(key, value, function (err, replay) {
                if (err) {
                    reject(err)
                } else {
                    resolve(replay)
                }
            })
        })

    },
    /**
     * 删除指定的元素
     * @param key
     * @param value
     * @returns {Promise<unknown>}
     */
    removeListByValue: function (key, value) {
        let self = this;
        if (!this.client) return;
        return new Promise((resolve, reject) => {
            //当没有启动服务时，返回Null
            if (self.client.status!="ready") {
                resolve(null)
                return
            }
            self.client.lrem(key, 1, value, function (err, replay) {
                if (err) {
                    reject(err)
                } else {
                    resolve(replay)
                }
            })
        })
    },
    /**
     * 更新redis中的指定元素
     * @param key
     * @param index
     * @param newValue
     * @returns {Promise<unknown>}
     */
    updateListValueByIndex: function (key, index, newValue) {
        let self = this;
        if (!this.client) return;
        return new Promise((resolve, reject) => {
            //当没有启动服务时，返回Null
            if (self.client.status!="ready") {
                resolve(null)
                return
            }
            newValue = JSON.stringify(newValue);
            self.client.lset(key, 1, newValue, function (err, data) {
                if (err) {
                    reject(err)
                } else {
                    resolve(data)
                }
            })
        })
    },
    /**
     * 向指定位置插入元素
     * @param key
     * @param value
     * @param index
     * @returns {Promise<unknown>}
     */
    insertValueByIndex: function (key, value, index) {
        let self = this;
        if (!this.client) return;
        return new Promise((resolve, reject) => {
            //当没有启动服务时，返回Null
            if (self.client.status!="ready") {
                resolve(null)
                return
            }
            index = Number(index);
            if (index === 0) {
                self.client.lindex(key, index, function (err, result) {
                    self.client.linsert(key, "BEFORE", result, value, function (err, replay) {
                        if (err) {
                            reject(err)
                        } else {
                            resolve(replay)
                        }
                    })
                });
            } else {
                self.client.lindex(key, index - 1, function (err, result) {
                    self.client.linsert(key, "AFTER", result, value, function (err, replay) {
                        if (err) {
                            reject(err)
                        } else {
                            resolve(replay)
                        }
                    })
                })
            }
        })
    },
    /**
     * 根据下标获取表中的指定数据
     * @param key
     * @param index
     * @returns {Promise<unknown>|null}
     */
    getValueByIndex: function (key, index) {
        let self = this;
        if (!this.client) return null;
        return new Promise((resolve, reject) => {
            //当没有启动服务时，返回Null
            if (self.client.status!="ready") {
                resolve(null)
                return
            }

            self.client.lindex(key, index, function (err, data) {
                if (err) {
                    reject(err)
                } else {
                    resolve(data)
                }
            })
        })
    },
    /**
     * 查询指定范围的数据
     * @param key
     * @param begin
     * @param end
     * @returns {Promise<unknown>|null}
     */
    getListByRange: function (key, begin, end) {
        let self = this;
        if (!this.client) return null;
        return new Promise((resolve, reject) => {
            //当没有启动服务时，返回Null
            if (self.client.status!="ready") {
                resolve(null)
                return
            }

            self.client.lrange(key, begin, end, function (err, data) {
                if (err) {
                    reject(err)
                } else {
                    resolve(data)
                }
            })
        })
    },
    /**
     * 删除整个表
     * @param key
     * @returns {Promise<unknown>}
     */
    deleteKey: function (key) {
        let self = this;
        if (!this.client) return;
        return new Promise((resolve, reject) => {
            //当没有启动服务时，返回Null
            if (self.client.status!="ready") {
                resolve(null)
                return
            }

            self.client.del(key, function (err, data) {
                if (err) {
                    reject(err)
                } else {
                    resolve(data)
                }
            })
        })
    },
    /**
     * 使用redis事务
     * @param functions [client.multi(),rpush(),rpush(),rpush()]//为多条redis的执行语句，其中multi和exec为事务的开启和结束标志。
     * @returns {Promise<unknown>}
     */
    insertListTransaction: function (functions) {
        let self = this;
        if (!this.client) return;
        return new Promise((resolve, reject) => {
            //当没有启动服务时，返回Null
            if (self.client.status!="ready") {
                resolve(null)
                return
            }

            self.client.multi(functions).exec(function (err, replies) {
                if (err) {
                    reject(err)
                } else {
                    resolve(replies)
                }
            })
        })
    }
};