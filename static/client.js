(function(){
    if(window["WebSocket"]){
        console.log("you are good");
    }else{
        console.log("browser doesn't support websocket");
    }
})()
