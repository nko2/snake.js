(function(){
    if(window["WebSocket"]){
        console.log("you are good to go");
        $(document).ready(function(){
            // initialize canvas
            var canvas = $('#canvas')[0];
            var context = canvas.getContext('2d');
            context.fillRect(0, 0, 9, 9);
            
            // connect
            var socket = io.connect("/");
            socket.on('news', function(data){
                console.log(data);
                socket.emit('my other event', {my: 'data'});
            });
            
            // key events
            $(document).keydown(function(event){
                var keycode = event.keyCode?event.keyCode: event.which;
                switch(keycode){
                    case 37: 
                        console.log('left');
                        break;
                    case 38: 
                        console.log('up');
                        break;
                    case 39: 
                        console.log('right');
                        break;
                    case 40: console.log('down');
                        break;
                }
            });
        });
    }else{
        console.log("browser doesn't support websocket");
    }
})()
