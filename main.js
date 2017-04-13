const electron = require('electron')
// Module to control application life.
const app = electron.app
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;
const ipc = electron.ipcMain;
const path = require('path');
const url = require('url');
const websocket = require('websocket').client;
const dateFormat = require('dateformat');


let mainWindow;

function createWindow () {
  mainWindow = new BrowserWindow({width: 800, height: 600, show:false})

  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }));

  mainWindow.webContents.openDevTools();
  mainWindow.on('closed', function () {
    mainWindow = null
  });
  mainWindow.once('ready-to-show', ()=>{
      mainWindow.show(true);
      client.connect('ws://10.3.1.190:1337/');

  });
  mainWindow.setMenu(null);
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
    app.quit()
});

app.on('activate', function () {
 if (mainWindow === null) {
    createWindow()
  }
});

let client = new websocket();

client.on('connect', function(connection) {
    console.log('WebSocket Client Connected');
    mainWindow.webContents.send("connected", "");

    connection.on('error', function(error) {
        console.log("Connection Error: " + error.toString());
    });
    connection.on('close', function() {
        console.log('echo-protocol Connection Closed');
    });
    connection.on('message', function(message) {
        console.log(message.utf8Data );

            let j = JSON.parse(message.utf8Data);
            switch (j.type){
                case "color":
                    mainWindow.webContents.send("color", j.data);
                    break;
                case "history":
                    for (var i=0; i < j.data.length; i++) {
                        mainWindow.webContents.send("message", j.data[i].author, j.data[i].text, j.data[i].color, new Date(j.data[i].time));
                    }
                    break;
                case "message":
                    mainWindow.webContents.send("message", j.data.author, j.data.text, j.data.color, new Date(j.data.time));

                    break;
                case "connection":
                    mainWindow.webContents.send("connectedPeople", j.data);

                    console.log(j.data);
            }
    });
    ipc.on("message", (event, msg)=>{
       connection.sendUTF(JSON.stringify({ type:'message', data: msg }));
    });
    ipc.on("username", (event, username)=>{
        connection.sendUTF(JSON.stringify({ type:'username', data: username }));
    });
});


