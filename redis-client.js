/**
 * redis服务器的客户端
 * */

const redis = require('redis')
//常用的js函数类
const _ = require('lodash')
const $log4js = require('./log4js')

module.exports = {
    /**
     * {RedisClient}
     */
    client: null,
    /**
     * Create a new Client instance.
     * @param {object|string} config Configuration or connection string for new MySQL connections
     * @public
     */
    createClient: function (config){
        if (!config.enable) return;
        this.client = redis.createClient(config)
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
     * @param {int} time 秒单位
     * @returns {boolean}
     */
    set: function (key, val, time) {
        if (!this.client) return;
        if (typeof val === 'object') {
            val = JSON.stringify(val)
        }
        if (this.client.connected) return false
        if (!time) {
            this.client.set(key, val)
        } else {
            //将毫秒单位转为秒
            this.client.setex(key, time, val);
        }

        return true
    },
    /**
     * 得到json对象
     * @param {string} key 键的名称
     * @returns {Promise<unknown>|null}
     */
    get: function (key) {
        let self = this
        if (!this.client) return null;
        return new Promise((resolve, reject) => {
            if (!self.client.connected) {
                resolve(null)
                return
            }
            self.client.get(key, (err, val) => {
                if (err) {
                    //$log4js.errLogger(null,err)
                    //resolve(null)
                    reject(err)
                    return
                }
                if (val == null) {
                    resolve(null)
                    return
                }
                try {
                    resolve(JSON.parse(val))
                } catch (error) {
                    resolve(val)
                }
                self.client.quit()
            })
        })
    },
    /**
     * 删除表中的数据
     * @param {string} key 键的名称
     * @returns {boolean}
     */
    del: function (key) {
        let self = this;
        if (!this.client) return;
        if (!self.client.connected) return false
        self.client.del(key)
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
    hset: function (key, field, val) {
        let self = this;
        if (!this.client) return;
        if (typeof val === 'object') {
            val = JSON.stringify(val)
        }
        if (!self.client.connected) return false
        self.client.hset(key, field, val)
        return true
    },
    /*得到json对象
     key:表的名称
     field:字段名称
     val:字段值
     */
    /**
     * 得到json对象
     * @param {string} key 键的名称
     * @param {string} field 字段名称
     * @returns {Promise<unknown>|null}
     */
    hget: function (key, field) {
        let self = this;
        if (!this.client) return null;
        return new Promise((resolve, reject) => {
            //当没有启动服务时，返回Null
            if (!self.client.connected) {
                resolve(null)
                return
            }
            self.client.hget(key, field, (err, val) => {
                if (err) {
                    //$log4js.errLogger(null,err)
                    //resolve(null)
                    reject(err)
                    return
                }
                if (val == null) {
                    resolve(null)
                    return
                }
                try {
                    resolve(JSON.parse(val))
                } catch (error) {
                    resolve(val)
                }
            })
        })
    },
    /**
     * 删除表中的数据
     * @param {string} key 表的名称
     * @param {string} field 字段名称
     * @returns {boolean}
     */
    hdel: function (key, field) {
        let self = this;
        if (!this.client) return;
        if (!self.client.connected) return false
        self.client.hdel(key, field)
        return true
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
            if (!self.client.connected) {
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
            if (!self.client.connected) {
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
            if (!self.client.connected) {
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
            if (!self.client.connected) {
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
            if (!self.client.connected) {
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
            if (!self.client.connected) {
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
            if (!self.client.connected) {
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
            if (!self.client.connected) {
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