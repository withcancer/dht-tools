const elasticsearch = require('elasticsearch');
const readLine = require('fs-readline');
const eclient = new elasticsearch.Client({
  host: 'localhost:9200',
  keepAlive: true
})

let rl = readLine('./work.txt')
let ss = new Set()
let body = []
rl.on('line', function (line, idx) {
  ss.add(line)
}).on('close', function () {
  ss.forEach((item) => {
    body.push({
      index: {
        _index: 'seo_word',
        _type: 'common'
      }
    })
    body.push({
      word: item
    })
  })
  eclient.bulk({ body: body }).then((res) => {
    console.log(res)
  }).catch((err) => {
    console.log(err)
    process.exit(-1)
  })
})