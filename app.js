// server.js 
var http = require('http'),
    nko = require('nko')('ERgE+tx6AIvYXqIr'), 
    express = require('express'),
    app = require('express').createServer(),
    io = require('socket.io').listen(app);

app.configure(function(){
    app.use(express.static(__dirname + '/static'));
});

app.listen(process.env.NODE_ENV === 'production' ? 80 : 8000, function() {
    // if run as root, downgrade to the owner of this file
    if (process.getuid() === 0)
        require('fs').stat(__filename, function(err, stats) {
        if (err) return console.log(err)
            process.setuid(stats.uid);
    });
});

app.get('/', function (req, res) {
    res.sendfile(__dirname + '/index.html');
});

io.sockets.on('connection', function (socket) {
    socket.emit('news', { hello: 'world' });
    socket.on('my other event', function (data) {
        console.log(data);
    });
});

console.log('Listening on ' + app.address().port);
