const elasticsearch = require('elasticsearch')
const axios = require("axios")
const redis = require("redis")
const sleep = require('sleep')
rclient = redis.createClient()
const authKey = "afacda8f862d679e4f4cf52356c305bcd415ab736d547fcd7eb1ac519a766dd2"
const eclient = new elasticsearch.Client({
    host: 'localhost:9200',
    log: 'error'
})

rclient.SRANDMEMBER('infohash', 1, function (err, res) {
    if (err) {
        console.log(err)
        process.exit(-1)
    }
    getMetaData(res[0])
})

function getMetaData(infohash) {
    sleep.msleep(1000)
    console.log('hanling :' + infohash)
    axios.get(`https://api.bthub.org/bencode/${authKey}/${infohash}`).then((res) => {
        if (res.data.status === 1 || res.data.status === 2 || res.data.status == 3 || res.data.status === 4) {
            rclient.SMOVE('infohash','infohash_error', infohash)
            console.log(infohash + ": status is " + res.data.status)
        } else {
            let files = []
            res.data.f.map((file) => {
                let fileName = file.split('|')[0]
                let fileLength = parseInt(`0x${file.split('|')[1]}`)
                files.push({ path: fileName, length: fileLength })
            })
            let data = {
                index: 'torrent_info',
                type: 'common',
                id: infohash.toLowerCase(),
                body: {
                    body: {
                        script: 'ctx._source.popularity += 1',
                        upsert: {
                            name: res.data.n,
                            length: res.data.l,
                            popularity: 1,
                            create_time: res.data.d,
                            files: files
                        }
                    }
                }
            }
            eclient.update(data).then((res) => {
                rclient.SMOVE('infohash','infohash_processed', infohash)
                console.log(infohash + ": processed")
            }).catch((err) => {
                console.log(err)
                process.exit(-1)
            })
        }
    })
    rclient.SRANDMEMBER('infohash', 1, function (err, res) {
        if (err) {
            console.log(err)
            process.exit(-1)
        }
        getMetaData(res[0])
    })
}

