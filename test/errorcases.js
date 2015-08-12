var Pipe = require('../lib/ws-datapiper');
var wss = require('./lib/listener.js');
var messageGlobal;
var count = 0;

function startServer(self, port, cb) {
    self.server = wss(port); 
    self.server.on('error', function (err) {
        console.log('server error: ' + err);
    });
    self.server.on('connection', function connection(ws) {
        ws.on('message', cb);
    });
}

describe('testing basics', function () {
    
    afterEach(function (done) {
        this.timeout(6000);
        if (this.server) {
            this.server.close();
        }
        this.client.close();
        setTimeout(done, 3000);
    }); 

    it('should send data to WebSocket Server', function (done) {
        this.timeout(5000);
        startServer(this, 4321, function (message) {
            if (message === messageGlobal) {
                done();
            } else {
              throw('Web Socket Message inconsistent'); 
            }
        });
        var self = this;
        setTimeout(function () {
            self.client = new Pipe('http://localhost:4321', {timeout: 1000, queueSize: 10000}); 
            messageGlobal = 'tHiS Is A T35t';
            self.client.send(messageGlobal);
        }, 2000);
    });
    it('should not throw an error when server is closed', function (done) {
        var self = this;
        this.timeout(5000); 
        setTimeout(function () {
            self.client = new Pipe('http://localhost:4321', {timeout: 1000, queueSize: 10000}); // this server doesn't exist 
            messageGlobal = 'tHiS Is A T35t';
            self.client.send(messageGlobal);
            setTimeout(done, 3000);
        }, 1000);
    }); 
});

describe('testing different scenarios where corresponding server goes down', function () {
    afterEach(function (done) {
      this.timeout(6000);
      this.server.close();
      this.client.close();
      setTimeout(done, 1000);
    });

    it('should send all 1000 data points for both when server is down and when it is back up, it resends all 1000 data points correctly. It will fail by timeout if it does not receive all data points', function (done) {
        this.timeout(300 * 1000);
        var self = this;
        self.client = new Pipe('http://localhost:3322', {timeout: 5000, queueSize: 10000});
        // Sends data when server is down
        for (var i = 1; i <= 1000; i += 1) {
            self.client.send('tHiS i5 4 T35T');
        }
        setTimeout(function() {
            // Server comes back up
            startServer(self, 3322, function (message) {
                count += 1;
                if (count == 1000) {
                    done();
                }
            });
        }, 1000);
    }); 

    it('resends all data correctly after server goes down and comes back up again. It will fail if it does not receive all data points', function (done) {
        this.timeout(300 * 1000);
        var self = this;
        var flag = false;
        // Starts Server
        startServer(this, 4455, function (message) {
          flag = true;
        });
        // Send Data after a second
        setTimeout (function () {
            self.client = new Pipe('http://localhost:4455', {timeout: 5000, queueSize: 10000});
            self.client.send('this will be sent immediately');
        }, 1000);

        // After 3 seconds send 1000 data points and bring the server back up in 3 seconds after that.
        setTimeout(function() {
            self.server.close();
            setTimeout(function() {
                // This data will be queued
                for (var i = 1; i < 1000; i += 1) {
                    self.client.send(i);
                }
                count = 0;
                startServer(self, 4455, function (message) {
                    count += 1;
                    if (count === 1000 && message == '1000th message' && flag) {
                        done();
                    }
                });
                self.client.send('1000th message');
            }, 3000);
        }, 3000);
    });
});
