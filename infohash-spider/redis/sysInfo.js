const client = require('../common/redis')

// 增加发送请求数
exports.incrSendRequest = function () {
    client.hincrby('sysInfo', 'sendRequest', 1)
}

// 增加接收响应数
exports.incrReceiveReponse = function () {
    client.hincrby('sysInfo', 'receiveReponse', 1)
}

// 增加接收错误数
exports.incrReceiveError = function () {
    client.hincrby('sysInfo', 'receiveError', 1)
}

