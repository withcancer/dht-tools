const redis = require("redis"),
    logger = require('./logger'),
    config = require('../config'),
    client = redis.createClient({port: config.redis.port, host: config.redis.host, password: config.redis.password})

client.on("error", function (error) {
    logger.error('redis错误: ' + error)
})

client.on('end', function () {
    logger.info('redis服务器连接被断开')
});

module.exports = client