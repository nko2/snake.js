var http = require('http'),
    _ = require('underscore'),
    util = require('util'),
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

var validDirections = ['up', 'down', 'left', 'right'];

io.sockets.on('connection', function (socket) {

    //api: socket.emit('set nickname', {nickname: 'bot'});
    socket.on('set nickname', function (data) {
        socket.set('nickname', data.nickname, function() {
            socket.emit('set nickname ok', {data:'me'});
        });
    });

    //api: socket.emit('set direction', {direction: 'up', 'down', 'left', 'right'});
    socket.on('set direction', function (data) {
        if( _.contains( validDirections, data.direction )) {
            socket.set('direction', data.direction, function() {
                socket.emit('set direction ok', {data:'me'});
            });
        } else {
            socket.emit('set direction fail');
        }
    });

    socket.emit('news', { hello: 'world' });
});

console.log('Listening on ' + app.address().port);
