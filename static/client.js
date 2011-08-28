(function(){
    if(window["WebSocket"]){
        console.log("you are good to go");
        $(document).ready(function(){
            // initialize canvas
            var canvasBlocks = {X_MAXLENGTH: 80, Y_MAXLENGTH:60, width:9, height:9};
            var canvas = $('canvas#canvas')[0];
            var context = canvas.getContext('2d');
            var posX = 0, posY = 1;
            
            // draw one snake block
            var drawBlock = function(x, y){
                context.fillRect(x, y, 9, 9);
            }
            
            // draw the default gray playground 
            var clearMap = function(){
                var x, y;
                context.fillStyle = "#fff";
                context.fillRect(0, 0, 800, 600);
                context.fillStyle = "#efefef";
                for(x = 0; x < canvasBlocks.X_MAXLENGTH; x++){
                    for(y = 0; y < canvasBlocks.Y_MAXLENGTH; y++){
                        drawBlock(10*x, 10*y);
                    }
                }
            }
            clearMap();
            
            // update the wall
            var updateMap = function(walls){
                context.fillStyle = "#000";
                $(walls).each(function(index, elem){
                    drawBlock(10*block[posX], 10*block[poxY]);
                });
            };

            // draw one snake
            var drawOneSnake = function(snake){
                var snakeColor = {"#C00": "#ee0000", "#0C0": "#00ee00", "#00C":"#0000ee"};
                $(snake.body).each(function(index, block){
                    if(index == 0){
                        context.fillStyle = snake.color;
                        drawBlock(10*block[posX], 10*block[posY]);
                        /*
                        //context.fillRect(10*block[posX]-0.5, 10*block[posY]-0.5, 10, 10);
                        context.fillStyle = "#fff";
                        context.font         = '9px sans-serif';
                        context.textBaseline = 'top';
                        context.fillText  ('C', 10*block[posX], 10*block[posY]);                       
                        */
                    }else{
                        context.fillStyle = snakeColor[snake.color];
                        drawBlock(10*block[posX], 10*block[posY]);
                    }
                });
            }
            // draw/update snakes
            var drawSnakes = function(snakes){
                _.each(snakes, function(snake){
                if(snake.state === "baby"){
                    //console.log("snake: " + snake.nickname + " was borned!");
                }else if(snake.state === "alive"){
                }else if(snake.state === "deathBySnake"){
                    console.log("snake: " + snake.nickname + "died of hitting another snake");
                }else if(snake.state ===" deathByBoundary"){
                    console.log("snake: " + snake.nickname + " died of hitting the wall.");
                }
                    drawOneSnake(snake);
                });
            }
        
            var drawOneCherry = function(cherry){
                context.fillStyle = '#AB0000';
                drawBlock(10*cherry.coord[0], 10*cherry.coord[1]);
                context.fillStyle = '#0A0';
                context.fillRect(10*cherry.coord[posX] + 4, 10*cherry.coord[posY] - 3, 2, 3);
            };

            var drawCherries = function(cherries){
                _.each(cherries, function(cherry){
                    drawOneCherry(cherry);
                });
            };

            // connect
            var socket = io.connect("/");
            socket.on('game state', function(data){
                //console.log(data.snakes);
                clearMap();
                drawSnakes(data.snakes);
                drawCherries(data.cherries);
            });
            socket.on('death by snakes', function(snake){
                console.log("snake died of hitting other snakes.");
            });
            socket.on('death by boundary', function(snake){
                console.log(snake);
            });
            // key events
            $(document).keydown(function(event){
                var keycode = event.keyCode?event.keyCode: event.which;
                switch(keycode){
                    case 37: 
                        socket.emit('set direction', {direction:'left'});
                        console.log('left');
                        break;
                    case 38: 
                        socket.emit('set direction', {direction:'up'});
                        console.log('up');
                        break;
                    case 39: 
                        socket.emit('set direction', {direction:'right'});
                        console.log('right');
                        break;
                    case 40: 
                        socket.emit('set direction', {direction:'down'});
                        console.log('down');
                        break;
                }
            });
        });
    }else{
        console.log("browser doesn't support websocket");
    }
})()
