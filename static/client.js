(function(){
    if(window["WebSocket"]){
        console.log("you are good to go");
        $(document).ready(function(){
            // initialize canvas
            var canvasBlocks = {x: 80, y:60, width:9, height:9};
            var canvas = $('#canvas')[0];
            var context = canvas.getContext('2d');
            var x, y;

            // draw the default gray playground 
            context.fillStyle = "#efefef";
            for(x = 0; x < canvasBlocks.x; x++){
                for(y=0; y < canvasBlocks.y; y++){
                    context.fillRect(10*x,10*y, 9, 9);
                }
            }
            // update the wall
            var updateMap = function(walls){
                context.fillStyle = "#000";
                $(walls).each(function(index, elem){
                    context.fillRect(10*elem[0], 10*elem[1], 9, 9);
                });
            };
            var drawOneSnake = function(snake){
                context.fillStyle = snake.color;
                $(snake.body).each(function(index, block){
                    context.fillRect(10*block[0], 10*block[1], 9, 9);
                });
            }
            // draw/update snakes
            var drawSnakes = function(snakes){
                $(snakes).each(function(index, snake){ drawOneSnake(snake);});
            }
            // connect
            var socket = io.connect("/");
            socket.on('game state', function(data){
                console.log(data);
                //updateMap(data.walls);
            });
            
            var snakeSample1 = {id:"1", color:"red", head: [50, 50], body:[[51,50],[52,50], [53,50]], name:"mindy", state:"alive"}; 
            var snakeSample2 = {id:"2", color:"blue", head:[60, 60], body:[[61,50],[62,50]], name:"charlie", state:"alive"}; 
            var snakes = [snakeSample1, snakeSample2];
            drawSnakes(snakes);
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
