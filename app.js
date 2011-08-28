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
var STATE = { ALIVE : 'alive', DEATH_BY_BOUNDARY : 'deathByBoundary', DEATH_BY_SNAKE : 'deathBySnake', BABY : 'baby' };
var MAX_BABY = 10;
var BABY_LENGTH = 3;
var BABY_TIME = 1000;
var DEATH_TIME = 1000;

// new snakes
var babyIndex = 0;

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

// game
var game = {
    frame : 0,
    ts : Date.now(),
    snakes : {},
    cherries : [],
    walls : level1
};


//server collision map
var Map = function(){
    this.data = {};
};
Map.prototype.key = function( coord ) {
    return '' + coord[0] + ',' + coord[1];
};
Map.prototype.get = function( coord ) {
    return this.data[this.key(coord)];
};
Map.prototype.set = function( coord, o ) {
    var point = this.get(coord);
    if( !point ){ 
        point = [];
        point.push(o);
        this.data[this.key(coord)] = point;
    } else {
        this.data[this.key(coord)].push(o);
    }
};
Map.prototype.simulate = function() {
    var that = this;
    _.each( this.data, function(items, i){
        var coord = i.split(',');
        var x = +coord[0];
        var y = +coord[1];
        if ( x < X.MIN || y < Y.MIN || x >= X.LENGTH || y >= Y.LENGTH ) {
            console.log('wall collision');
            _.each( items, function( item ){
                if ( item instanceof Snake ) {
                    item.die( STATE.DEATH_BY_BOUNDARY );
                }
            });
        }
        if ( items.length > 1 ){
            console.log('object collision');
            var headHits = [];
            var bodyHits = [];
            var cherryHits = [];
            _.each( items, function( item ){
                if ( item instanceof Snake ) {
                    if ( that.key(item.body[0]) == coord ) {
                        headHits.push(item);
                    } else {
                        bodyHits.push(item);
                    }
                } else if ( item instanceof Cherry ) {
                    cherryHits.push(item);
                }
            });

            //add cherry first
            if ( cherryHits.length == 1 ){
                _.each( headHits, function(headHit){
                    headHit.eat(cherryHits[0]);
                    cherryHits[0].clear();
                });
            }
           
            //calculate collision     
            if ( headHits.length > 1 || bodyHits.length > 0 ) {
                _.each( headHits, function(headHit){
                    headHit.die( STATE.DEATH_BY_SNAKE );
                });
            }
        }
    });
};

// Snake
var Snake = function(){
    this.createdAt = Date.now();
    this.food = 0;
};
Snake.prototype.die = function( method ) {
    if( !this.diedAt ) {
        this.state = method;
        this.diedAt = Date.now();
    }
};
Snake.prototype.eat = function( item ) {
    if( item instanceof Cherry ){
        this.food += item.food;
    }
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
        this.newDirection = direction;
    }
};
Snake.prototype.resetDirection = function() {
    this.newDirection = 'right';
};
Snake.prototype.move = function() {
    var newX = this.body[0][0];
    var newY = this.body[0][1];
    this.direction = this.newDirection;
    if ( this.direction == 'up' ) {
        --newY;
    } else if ( this.direction == 'down' ) {
        ++newY;
    } else if ( this.direction == 'left' ) {
        --newX;
    } else {
        ++newX;
    }
    if(this.food <= 0){
        this.body.pop();
    } else {
        --this.food;
    };
    this.body.unshift([newX, newY]);
};
Snake.prototype.moveToStart = function() {
    var start = [ BABY_LENGTH, (babyIndex++ % MAX_BABY) + 1 ];
    var body = [];
    for( var i = BABY_LENGTH, ii = 0; i > ii; --i ) {
        body.push( [ i, start[1] ] );
    }
    this.setBody( body );
    this.resetDirection();
};
Snake.prototype.died = function() {
    return this.state == STATE.DEATH_BY_BOUNDARY || this.state == STATE.DEATH_BY_SNAKE;
};

// coord
var Coord = function(x, y){
    this.x = x;
    this.y = y;
};
Coord.prototype.toString = function() {
    return '' + this.x + ',' + this.y;
};

// cherry
var CHERRY_FOOD = 5;
var CHERRY_LIFETIME = 300;
var MAX_CHERRIES = 30;
var CHERRY_ODDS = 0.5;
var Cherry = function(map){
    if ( Math.random() > CHERRY_ODDS ) {
        return;
    }
    this.food = CHERRY_FOOD;
    this.lifetime = CHERRY_LIFETIME;
    this.active = false;

    var x = Math.floor(Math.random() * X.LENGTH);
    var y = Math.floor(Math.random() * Y.LENGTH);
    this.coord = [ x, y ];
    
    var occupied = map.get(this.coord);
    if (!occupied){
        this.active = true;
    }
};
Cherry.prototype.toString = function(){
    return util.inspect(this);
}
Cherry.prototype.clear = function(){
    this.lifetime = 0;
}

// GAME!
setInterval( function() {
    var start = Date.now();
    game.frame += 1;
    game.ts = Date.now();

    var map = new Map();
    // compute new snake states
    _.each(game.snakes, function( snake, i, o ) {
        if( snake.state == STATE.BABY && (Date.now() - snake.createdAt) > BABY_TIME) {
            snake.setState(STATE.ALIVE);
        }
        if( snake.died() && (Date.now() - snake.diedAt) > DEATH_TIME) {
            snake.createdAt = Date.now();
            delete snake.diedAt;
            snake.state = STATE.BABY;
            snake.moveToStart();
        }
        if( snake.state == STATE.ALIVE ) {
            snake.move();
        }

        if( snake.state == STATE.ALIVE ){
            _.each(snake.body, function( section ) {
                map.set(section, snake);
            });
        }
    });

    // add cherries to map
    _.each(game.cherries, function(cherry){
        map.set(cherry.coord, cherry);
    });

    map.simulate();

    //update cherries
    var updatedCherries = [];
    _.each(game.cherries, function(cherry, i, o) {
        --cherry.lifetime;
        if(cherry.lifetime > 0){
            updatedCherries.push(cherry);
        }
    });
    game.cherries = updatedCherries;

    if ( game.cherries.length < MAX_CHERRIES ) {
        var cherry = new Cherry(map);
        if (cherry.active) {
            game.cherries.push(cherry);    
        }
    }
//    console.log(game.cherries);

    //console.log( 'Frame took ' + (Date.now() - start) + 'ms to compute' );
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
    snake.moveToStart();

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
    socket.on('disconnect', function () {
        delete game.snakes[socket.id];
    });

});

console.log('Listening on ' + app.address().port);
