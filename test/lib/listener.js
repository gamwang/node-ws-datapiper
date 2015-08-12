
var WebSocketServer = require('ws').Server;

module.exports = function (port) {
    return  new WebSocketServer({ port: port, keepalive: true  });
};
