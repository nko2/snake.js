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
var OPPOSITE_DIRECTIONS = { 'up' : 'down', 'down' : 'up', 'left' : 'right', 'right' : 'left' };
var DEFAULT_NAMES = ['Sneezy', 'Sleepy', 'Dopey', 'Doc', 'Happy', 'Bashful', 'Grumpy'];
var DEFAULT_COLORS = ['#C00', '#0C0', '#00C'];
var X = { MIN : 0, LENGTH : 80 };
var Y = { MIN : 0, LENGTH : 60 };
var FRAME_LENGTH = 150; //ms
var STATE = { ALIVE : 'alive', DEAD : 'dead', BABY : 'baby' };
var MAX_BABY = 10;
var BABY_LENGTH = 3;
var BABY_TIME = 3000;

// levels
var level1 = (function() {
    /*
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
    */
    return []
})();

var emptyMap = (function() {
    var map = [];
    for( var i = X.MIN, ii = X.LENGTH; i < ii; ++i ) {
        map[i] = [];
        for( var j = Y.MIN, jj = Y.LENGTH; j < jj; ++j ) {
            map[i][j] = null;
        }
    }
    return map;
})();

//server collision map
var map = emptyMap;

// game
var game = {
    frame : 0,
    ts : Date.now(),
    snakes : {},
    walls : level1
};

// new snakes
var babyIndex = 0;

// Snake
var Snake = function(){
    this.createdAt = Date.now();
};

Snake.prototype.setNickname = function( nickname ) {
    this.nickname = nickname;
};

Snake.prototype.setColor = function( color ) {
    this.color = color;
};

Snake.prototype.setBody = function( body ) {
    this.body = body;
};

Snake.prototype.setState = function( state ) {
    this.state = state;
};

Snake.prototype.setDirection = function( direction ) {
    if ( OPPOSITE_DIRECTIONS[direction] !== this.direction ) {
        this.direction = direction;
    }
};

Snake.prototype.move = function() {
    var newX = this.body[0][0];
    var newY = this.body[0][1];
    if ( this.direction == 'up' ) {
        --newY;
    } else if ( this.direction == 'down' ) {
        ++newY;
    } else if ( this.direction == 'left' ) {
        --newX;
    } else {
        ++newX;
    }
    this.body.pop();
    this.body.unshift([newX, newY]);
};


// send system state
setInterval( function() {
    var start = Date.now();
    game.frame += 1;
    game.ts = Date.now();

    // compute new states
    _.each(game.snakes, function( snake ) {
        //new snakes
        if( snake.state == STATE.BABY && (Date.now() - snake.createdAt) > BABY_TIME) {
            snake.setState(STATE.ALIVE);
            //var collision = map.addSnake(snake);
        }

        //move snakes
        snake.move();
        
    });

    console.log( 'Frame took ' + (Date.now() - start) + 'ms to compute' );
    // send to all the users
    _.each( io.sockets.sockets, function( socket ) {
        socket.emit('game state', game);
    });
}, FRAME_LENGTH );

// socket logic
io.set('log level', 1);
io.sockets.on('connection', function (socket) {

    var snake = new Snake();
    snake.setNickname( DEFAULT_NAMES[+socket.id.substring(0, 10) % DEFAULT_NAMES.length] );
    snake.setColor( DEFAULT_COLORS[+socket.id.substring(0, 10) % DEFAULT_COLORS.length] );
    snake.setState( STATE.BABY );
    var start = [ BABY_LENGTH, (babyIndex++ % MAX_BABY) + 1 ];
    var body = [];
    for( var i = BABY_LENGTH, ii = 0; i > ii; --i ) {
        body.push( [ i, start[1] ] );
    }
    snake.setBody( body );
    snake.setDirection( 'right' );

    game.snakes[socket.id] = snake;

    //api: socket.emit('set nickname', {nickname: 'bot'});
    socket.on('set nickname', function (data) {
        game.snakes[socket.id].setNickname( data.nickname );
    });

    //api: socket.emit('set direction', {direction: 'up', 'down', 'left', 'right'});
    socket.on('set direction', function (data) {
        if( _.contains( VALID_DIRECTIONS, data.direction )) {
            game.snakes[socket.id].setDirection( data.direction );
        }
    });

});

console.log('Listening on ' + app.address().port);
