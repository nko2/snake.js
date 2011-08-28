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
            /*
            var snakeLogo = (function(){
                var headerCanvas = $("#header")[0];
                var headerContext = headerCanvas.getContext('2d');
                var x, y;
                headerContext.fillStyle = "#ccc";
                for(x = 0; x < 110; x++){
                    for(y = 0; y < 10; y++){
                        headerContext.fillRect(10*x, 10*y, 9, 9);
                    }
                }
            })();*/
            
            // draw the default gray playground 
            var clearMap = function(){
                var x, y;
                context.fillStyle = "#dedede";
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
                context.fillStyle = snake.color;
                if(snake.state === "baby"){
                    $(snake.body).each(function(index, block){
                        drawBlock(10*block[posX], 10*block[posY]);
                    });
                }else if(snake.state === "alive"){
                    $(snake.body).each(function(index, block){
                        drawBlock(10*block[posX], 10*block[posY]);
                    });
                }
            }
            // draw/update snakes
            var drawSnakes = function(snakes){
                _.each(snakes, function(snake){
                    drawOneSnake(snake);
                });
            }
        
            var drawOneCherry = function(cherry){
                context.fillStyle = '#8B0000';
                drawBlock(10*cherry.coord[0], 10*cherry.coord[1]);
            };

            var drawCherries = function(cherries){
                _.each(cherries, function(cherry){
                    drawOneCherry(cherry);
                });
            };

            // connect
            var socket = io.connect("/");
            socket.on('game state', function(data){
                //console.log(data);
                clearMap();
                drawSnakes(data.snakes);
                drawCherries(data.cherries);
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
