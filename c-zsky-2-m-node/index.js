const elasticsearch = require('elasticsearch');
const moment = require('moment');
const eclient = new elasticsearch.Client({
  host: 'localhost:9200',
  keepAlive: true,
  log: 'error'
})
const mysql = require('mysql');
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '1qaz0okm@',
  database: 'fuck'
})

let body = []

connection.connect();

var query = connection.query('select MAIN.info_hash,MAIN.name,MAIN.length,MAIN.create_time,DETAIL.file_list from search_hash as MAIN inner join search_filelist as DETAIL on MAIN.info_hash = DETAIL.info_hash;');
query
  .on('error', function (err) {
    console.log(err)
    process.exit(-1)
  })
  .on('result', function (row) {
    let files = []
    try {
      files = JSON.parse(row.file_list)
    } catch (e) {

    }
    if (files.length == 0) {
      return
    }
    body.push({
      index: {
        _index: 'torrent_info',
        _type: 'common',
        _id: row.info_hash.toLowerCase()
      }
    })
    body.push({
      name: row.name,
      length: row.length,
      popularity: 1,
      create_time: moment(row.create_time).unix(),
      files: files
    })
    if (body.length > 40000) {
      connection.pause()
      eclient.bulk({ body: body }).then((res) => {
        body.length = 0
        connection.resume()
        console.log(res)
      }).catch((err) => {
        body.length = 0
        console.log(err)
        process.exit(-1)
      })
    }

  })
  .on('end', function () {
    // all rows have been received
    connection.end();
    console.log('all done!!')
  });



