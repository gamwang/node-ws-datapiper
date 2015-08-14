'use strict';

var util = require('util');

function Server (options) {
    require('ws').Server.call(this, options);
}

util.inherits(Server, require('ws').Server);

module.exports = Server;

