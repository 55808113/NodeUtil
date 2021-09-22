/**
 * redis服务器的客户端
 * */

const redis = require('redis')
//常用的js函数类
const _ = require('lodash')
const {$configlocal} = require('../../config')
const $log4js = require('./log4js')
let $client
if ($configlocal.redis.enable) {
    $client = redis.createClient($configlocal.redis)
    //const $client = redis.createClient($configlocal.redis)
    //当debug为真是不执行缓存
    $client.on('ready', function (res) {
        console.log('ready');
    });

    $client.on('end', function (err) {
        console.log('end！');
    });

    $client.on('error', function (err) {
        $log4js.errLogger(null, err)
    });

    $client.on('connect', function () {
        console.log('redis connect success!');
    });
}

module.exports = {
    /**
     * 设置对象
     * @param {string} key 键的名称
     * @param {string} val 字段值
     * @param {int} time 秒单位
     * @returns {boolean}
     */
    set: function (key, val, time) {
        if (!$configlocal.redis.enable) return;
        if (typeof val === 'object') {
            val = JSON.stringify(val)
        }
        if (!$client.connected) return false
        if (!time) {
            $client.set(key, val)
        } else {
            //将毫秒单位转为秒
            $client.setex(key, time, value);
        }

        return true
    },
    /**
     * 得到json对象
     * @param {string} key 键的名称
     * @returns {Promise<unknown>|null}
     */
    get: function (key) {
        if (!$configlocal.redis.enable) return null;
        return new Promise((resolve, reject) => {
            if (!$client.connected) {
                resolve(null)
                return
            }
            $client.get(key, (err, val) => {
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
                $client.quit()
            })
        })
    },
    /**
     * 删除表中的数据
     * @param {string} key 键的名称
     * @returns {boolean}
     */
    del: function (key) {
        if (!$configlocal.redis.enable) return;
        if (!$client.connected) return false
        $client.del(key)
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
        if (!$configlocal.redis.enable) return;
        if (typeof val === 'object') {
            val = JSON.stringify(val)
        }
        if (!$client.connected) return false
        $client.hset(key, field, val)
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
        if (!$configlocal.redis.enable) return null;
        return new Promise((resolve, reject) => {
            //当没有启动服务时，返回Null
            if (!$client.connected) {
                resolve(null)
                return
            }
            $client.hget(key, field, (err, val) => {
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
        if (!$configlocal.redis.enable) return;
        if (!$client.connected) return false
        $client.hdel(key, field)
        return true
    },
    /**
     * 列表 向redis中插入整个数组，其数组中为多条string类型的json数据
     * @param {string} key
     * @param list
     * @returns {boolean}
     */
    setList: function (key, list) {//添加整个数组
        if (!$configlocal.redis.enable) return;
        for (let i = 0; i < list.length; i++) {
            if ((typeof list[i]) === "object") {
                list[i] = JSON.stringify(list[i])
            }
        }
        $client.lpush(key, list[0]);
        for (let i = 1; i < list.length; i++) {
            $client.rpush(key, list[i])
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
        if (!$configlocal.redis.enable) return;
        return new Promise((resolve, reject) => {
            //当没有启动服务时，返回Null
            if (!$client.connected) {
                resolve(null)
                return
            }
            $client.rpush(key, value, function (err, replay) {
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
        if (!$configlocal.redis.enable) return;
        return new Promise((resolve, reject) => {
            //当没有启动服务时，返回Null
            if (!$client.connected) {
                resolve(null)
                return
            }
            $client.lrem(key, 1, value, function (err, replay) {
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
        if (!$configlocal.redis.enable) return;
        return new Promise((resolve, reject) => {
            //当没有启动服务时，返回Null
            if (!$client.connected) {
                resolve(null)
                return
            }
            newValue = JSON.stringify(newValue);
            $client.lset(key, 1, newValue, function (err, data) {
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
        if (!$configlocal.redis.enable) return;
        return new Promise((resolve, reject) => {
            //当没有启动服务时，返回Null
            if (!$client.connected) {
                resolve(null)
                return
            }
            index = Number(index);
            if (index === 0) {
                $client.lindex(key, index, function (err, result) {
                    $client.linsert(key, "BEFORE", result, value, function (err, replay) {
                        if (err) {
                            reject(err)
                        } else {
                            resolve(replay)
                        }
                    })
                });
            } else {
                $client.lindex(key, index - 1, function (err, result) {
                    $client.linsert(key, "AFTER", result, value, function (err, replay) {
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
        if (!$configlocal.redis.enable) return null;
        return new Promise((resolve, reject) => {
            //当没有启动服务时，返回Null
            if (!$client.connected) {
                resolve(null)
                return
            }

            $client.lindex(key, index, function (err, data) {
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
        if (!$configlocal.redis.enable) return null;
        return new Promise((resolve, reject) => {
            //当没有启动服务时，返回Null
            if (!$client.connected) {
                resolve(null)
                return
            }

            $client.lrange(key, begin, end, function (err, data) {
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
        if (!$configlocal.redis.enable) return;
        return new Promise((resolve, reject) => {
            //当没有启动服务时，返回Null
            if (!$client.connected) {
                resolve(null)
                return
            }

            $client.del(key, function (err, data) {
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
        if (!$configlocal.redis.enable) return;
        return new Promise((resolve, reject) => {
            //当没有启动服务时，返回Null
            if (!$client.connected) {
                resolve(null)
                return
            }

            $client.multi(functions).exec(function (err, replies) {
                if (err) {
                    reject(err)
                } else {
                    resolve(replies)
                }
            })
        })
    }
};
