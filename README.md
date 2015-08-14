# ws-datapiper

ws-datapiper is a wrapper around websocket sending data reliably to the server. It queues up any data that were not sent and resends it as soon as connection is opened between the client and the server

# Installation

```
npm install ws-datapiper --save
```

# Usage

Sending Data Example:

- Client:
```javascript
var Client = require('ws-datapiper');
var url = 'http://localhost:4321';
var options = {
    timeout: 5000,
    queueSize: 10000,
    timeIncr: 3000
};
var client = new Client(url, options); // Instantiates the client
var data = {
    id: "qorhvkalclrpTsp82",
    message: "This is data!"
};
client.send(data); // sends data to server in http://localhost:4321
```
- Server:
```javascript
var Server = require('ws-datapiper').Server;
var options = {
    port: 4321
};
var server = new Server(options); //Instantiates the server

server.on('connection', function () {
    console.log('connected');
});

server.on('data', function (data) {
    console.log('Received: ' + data);
});
```

# API

## Configuration

Configuration can be defined by passing it as an option when instantiating

Configuration options are:
* **queueSize:** The maximum size of the queue that will hold data when send method fails
* **timeout:** timeout, in miliseconds, in which recover function will be called when connection goes down.
* **timeIncr:** an increment, in miliseconds, that increases timeout parameter every time recover function fails to restore the connection

## Methods

* **send:** Tries to send the data to the server located at this.url. If connection is down, it queues the data to this.messageQueue so that resend method may send it later
* **close:** closes the connection
* **resend:** resends all the data in this.messageQueue to the server located in this.url
* **recover:** tries to reconnect to the server after this.timeout miliseconds
* **createSocket:** instantiates a new socket to a server in this.url

# Additional Information

If you have any questions, don't hesitate to email jnbai@paypal.com
