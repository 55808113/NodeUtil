/**
 session数据存储redis的类

 */
const $redisClient = require('./redis-client')
const { Store } = require("koa-session2");
class RedisStore extends Store {
    constructor() {
        super();
        //this.redis = $redisClient(redisConfig);
    }

    /**
     * 取得session的数据
     * @param sid
     * @param ctx
     * @returns {Promise<Joi.ObjectSchema.unknown|null>}
     */
    async get(sid, ctx) {
        return $redisClient.get(`SESSION:${sid}`);
    }

    /**
     * 设置session的数据
     * @param session
     * @param sid
     * @param maxAge
     * @param ctx
     * @returns {Promise<string>}
     */
    async set(session, {sid = this.getID(24), maxAge = 24*60*60*1000 } = {}, ctx) {
        try {
            // Use redis set EX to automatically drop expired sessions
            await $redisClient.set(`SESSION:${sid}`, session,maxAge/1000);
        } catch (e) {}
        return sid;
    }

    /**
     * 删除session的数据
     * @param sid
     * @param ctx
     * @returns {Promise<number>}
     */
    async destroy(sid, ctx) {
        let b = await $redisClient.del(`SESSION:${sid}`);
        if (b){
            return 1
        }else{
            return 0
        }
    }
}

module.exports = RedisStore;