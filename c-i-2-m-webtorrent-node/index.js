const elasticsearch = require('elasticsearch'),
    redis = require("redis"),
    Discovery = require('torrent-discovery'),
    Protocol = require('bittorrent-protocol'),
    ut_metadata = require('ut_metadata'),
    addrToIPPort = require('addr-to-ip-port'),
    bencode = require('bencode'),
    net = require('net')

rclient = redis.createClient()

const eclient = new elasticsearch.Client({
    host: 'localhost:9200',
    log: 'error'
})

const SELF_HASH = '4290a5ff50130a90f1de64b1d9cc7822799affd5';   // Random infohash

setInterval(() => {
    rclient.SRANDMEMBER('infohash', 1, function (err, res) {
        if (err) {
            console.log(err)
            process.exit(-1)
        }
        new Discovery({ infoHash: res[0], peerId: SELF_HASH, port: 6885, dht: true })
            .on('peer', function (peer) {
                const peerAddress = { address: addrToIPPort(peer)[0], port: addrToIPPort(peer)[1] }
                getMetadata(peerAddress, res[0])
            })
    })
}, 1)

const getMetadata = (peerAddress, infoHash) => {
    const socket = new net.Socket()
    socket.setTimeout(12000)
    socket.connect(peerAddress.port, peerAddress.address, () => {
        const wire = new Protocol()

        socket.pipe(wire).pipe(socket)
        wire.use(ut_metadata())

        wire.handshake(infoHash, SELF_HASH, { dht: true })
        wire.on('handshake', function (infoHash, peerId) {
            wire.ut_metadata.fetch()
        })

        wire.ut_metadata.on('metadata', function (rawMetadata) {
            metadata = bencode.decode(rawMetadata).info
            let length = 0
            let files = []
            if (metadata.length) {
                files.push({
                    path: metadata.name.toString('utf8'),
                    length: metadata.length
                })
            } else {
                metadata.files.map((file) => {
                    let fileName = file.path.toString('utf8')
                    let fileLength = file.length
                    files.push({ path: fileName, length: fileLength })
                    length += fileLength
                })
            }
            let data = {
                index: 'torrent_info',
                type: 'common',
                id: infoHash.toLowerCase(),
                body: {
                    script: 'ctx._source.popularity += 1',
                    upsert: {
                        name: metadata.name.toString('utf8'),
                        length: metadata.length || length,
                        popularity: 1,
                        create_time: metadata['creation date'] || 0,
                        files: files
                    }
                },
                retryOnConflict: 3
            }

            eclient.update(data).then((res) => {
                rclient.SMOVE('infohash', 'infohash_processed', infoHash)
                console.log(res)
            }).catch((err) => {
                rclient.SMOVE('infohash', 'infohash_error', infoHash)
                console.log(err)
            })
        })
    });
    socket.on('error', err => { socket.destroy() })
    socket.on('timeout', err => {
        rclient.SMOVE('infohash', 'infohash_timeout', infoHash)
    })
}

