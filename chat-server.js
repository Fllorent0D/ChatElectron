"use strict";
process.title = 'node-chat';
let  webSocketsServerPort = 1337;
// websocket and http servers
const webSocketServer = require('websocket').server;
const http = require('http');

// 100 derniers messages
let history = [ ];
let clients = [ ];

function htmlEntities(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;')
                      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

let colors = [ 'rouge', 'green', 'bleue', 'mauve', 'orange' ];
colors.sort(function(a,b) { return Math.random() > 0.5; } );

let server = http.createServer(function(request, response) {
    // Not important for us. We're writing WebSocket server, not HTTP server
});
server.listen(webSocketsServerPort, function() {
    console.log((new Date()) + " Server is listening on port " + webSocketsServerPort);
});

const wsServer = new webSocketServer({
    // WebSocket server is tied to a HTTP server. WebSocket request is just
    // an enhanced HTTP request. For more info http://tools.ietf.org/html/rfc6455#page-6
    httpServer: server
});

// Ce callback est appelé lorsque l'on se connecte
wsServer.on('request', function(request) {
    console.log((new Date()) + ' Connection from origin ' + request.origin + '.');

    let connection = request.accept(null, request.origin);
    // we need to know client index to remove them on 'close' event

    let index = clients.length;
    console.log(index);
    clients[index]= {"userName":false, "userColor": false, "connection" : connection};


    console.log((new Date()) + ' Connection accepted.');

    // send back chat history
    if (history.length > 0) {
        connection.sendUTF(JSON.stringify( { type: 'history', data: history} ));
    }
    let broadcast = (data) =>{
        for (var i=0; i < clients.length; i++) {
            if(clients != null)
                clients[i].connection.sendUTF(JSON.stringify(data));
        }
    };
    // user sent some message
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            console.log(message);
            try {
                let j = JSON.parse(message.utf8Data);
                switch(j.type){
                    case "username":
                        clients[index].userName = htmlEntities(j.data);
                        clients[index].userColor = colors.shift();

                        connection.sendUTF(JSON.stringify({ type:'color', data:  clients[index].userColor }));
                        console.log((new Date()) + ' User is known as: ' +  clients[index].userName + ' with ' +  clients[index].userColor + ' color.');

                        broadcast({ type:'connection', data: clients.map((item) => { if(item.userName != false) return item.userName}) });



                        break;
                    case "message":
                        console.log((new Date()) + ' Received Message from '
                            +  clients[index].userName + ': ' + j.data);

                        // we want to keep history of all sent messages
                        let obj = {
                            time: (new Date()).getTime(),
                            text: htmlEntities(j.data),
                            author:  clients[index].userName,
                            color:  clients[index].userColor
                        };
                        history.push(obj);
                        history = history.slice(-100);
                        broadcast({ type:'message', data: obj });

                        break;
                }
            } catch (e) {
                console.log(e);
                console.log('This doesn\'t look like a valid JSON: ', message.utf8Data.data);
                return;
            }



    }
    });

    // user disconnected
    connection.on('close', function(connection) {
        if ( clients[index].userName !== false &&  clients[index].userColor !== false) {
            console.log((new Date()) + " Peer " + connection.remoteAddress + " disconnected.");
            colors.push( clients[index].userColor);
            clients[index] = null;
            broadcast({ type:'connection', data: clients.map((item) => { if(item != null && item.userName != false) return item.userName}) });

        }
    });

});