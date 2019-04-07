const logger = require('./common/logger')
const spider = new (require('./lib/spider'))
const client = require('./common/redis')

spider.on('ensureHash', (hash, addr)=> {
    client.publish('channel', hash)
})

spider.listen(6339)