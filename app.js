var http = require('http'),
    _ = require('underscore'),
    util = require('util'),
    nko = require('nko')('ERgE+tx6AIvYXqIr'), 
    express = require('express'),
    app = require('express').createServer(),
    io = require('socket.io').listen(app);

// app server
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

// game globals
var VALID_DIRECTIONS = ['up', 'down', 'left', 'right'];
var X = { MIN : 0, LENGTH : 80 };
var Y = { MIN : 0, LENGTH : 60 };
var FRAME_LENGTH = 500; //ms

// maps
var map1 = function() {
    var walls = [];
    _.each( _.range( X.MIN, X.LENGTH ), function( x ) {
        walls.push( [ x, Y.MIN ] );
        walls.push( [ x, Y.MAX ] );
    });
    _.each( _.range( Y.MIN + 1, Y.LENGTH - 1 ), function( y ) {
        walls.push( [ X.MIN, y ] );
        walls.push( [ X.LENGTH - 1, y ] );
    });
    return walls;
};

// game
var game = {
    frame : 0,
    ts : Date.now(),
    snakes : [],
    walls : map1()
};

// send system state
setInterval( function() {
    game.frame += 1;
    game.ts = Date.now();

    // send to all the users
    _.each( io.sockets.sockets, function( socket ) {
        socket.emit('game state', game);
    });
}, FRAME_LENGTH );

// socket logic
io.sockets.on('connection', function (socket) {

    //api: socket.emit('set nickname', {nickname: 'bot'});
    socket.on('set nickname', function (data) {
        socket.set('nickname', data.nickname, function() {
            socket.emit('set nickname ok');
        });
    });

    //api: socket.emit('set direction', {direction: 'up', 'down', 'left', 'right'});
    socket.on('set direction', function (data) {
        if( _.contains( VALID_DIRECTIONS, data.direction )) {
            socket.set('direction', data.direction, function() {
                socket.emit('set direction ok');
            });
        } else {
            socket.emit('set direction fail');
        }
    });

    socket.emit('news', { hello: 'world' });
});


console.log('Listening on ' + app.address().port);
