'use strict';

var WebSocket = require('ws');

var Queue = require('./queue');
var print = require('./debug');

var count = 0;
var defaultTimeout;

var consts = { 
    MAXTIMEOUT: 5 * 60 * 1000
};

var status = {
    CONN: 'CONN',
    CONNECTING: 'CONNECTING',
    DISCON: 'DISCON', 
    TERM: 'TERMINATING'
};

module.exports = wsLogger;

function socketConfig(self) {
    self.ws.on('close', function() {
        if (self._status === status.TERM) {
            print('closing web socket initiated by user', self.debug);
        } else {
            self._status = status.DISCON;
            self.recover(); 
        }
    });
    self.ws.on('error', function(err) {
        self._status = status.DISCON;
        self.recover(); 
    });
    self.ws.on('open', function() {
        self._status = status.CONN;
        self.timeout = defaultTimeout;
        print('opened', self.debug);
        if (self.messageQueue.size() > 0) {
            print('resend', self.debug);
            self.resend();
        }
    });
}

function wsLogger(url, options) {
    var timeout = options.timeout || 30 * 1000;
    this.debug = options.debug || false;
    this._status = status.CONNECTING;
    this.url = url;
    this.messageQueue = new Queue(options.queueSize || 10000);
    this.createSocket();
    this.timeout = timeout;
    defaultTimeout = timeout;
    this.timeIncr = options.timeIncr || timeout;
}

// Tries to Create a WebSocket connection to the url
wsLogger.prototype.createSocket = createSocket; 

// Sends the data to designated WebSocket Server.
// If the server doesn't exist, queue the data to the messageQueue,
// and resend it to the server when it comes back up
wsLogger.prototype.send = send; 

// Resends all the data that are in the messageQueue to the WebSocket Server
wsLogger.prototype.resend = resend; 

// Recovers from close event and makes a new WebSocket
wsLogger.prototype.recover = recover; 

// Closes the WebSocket
wsLogger.prototype.close = close; 

function createSocket() {
    count += 1;
    print(count + ' createSocket() calls made total', this.debug);
    this.ws = new WebSocket(this.url);
    socketConfig(this);
};

function send(data) {
    var self = this;
    if (data) {
        // if socket is connected
        if (self._status === status.CONN) {
            try {
                self.ws.send(data.toString(), function ack (err) {
                    if (err) {
                        self.messageQueue.push(data);
                    }
                });
            } catch (err) {
                console.log('send err: ' + err);
            }
        } else {
            self.messageQueue.push(data);
        }
    }
}

function resend() {
    var self = this;
    // if socket is connected
    print(self._status, self.debug);
    if (self._status === status.CONN) {
        while (self.messageQueue.size() > 0) {
            var elem = self.messageQueue.shift();
            self.send(elem);
        }
    }
}

function recover() {
    var self = this;
    if (self._status === status.DISCON) {
        print('recover called', self.debug);
        self._status = status.CONNECTING;
        setTimeout(function () {
            print('recover finished', self.debug);
            self.createSocket();
            self.timeout = Math.min(self.timeout + self.timeIncr, consts.MAXTIMEOUT);
            setTimeout(function() {
                print(self._status, self.debug);
                if (self._status === status.DISCON) {
                    self.recover();
                } else if (self._status === status.CONN && self.messageQueue.size() > 0) {
                    self.resend();
                }
            }, 1000);
        }, self.timeout);
    }
}

function close() {
    this._status = status.TERM;
    this.ws.close();
}
