const electron = require('electron');
const ipc = electron.ipcRenderer;
const $ = jQuery = require('jquery');
const listMessageDom = $(".chat");
const dateFormat = require("dateformat");
let username = null;
let myColor = null;

ipc.on("message", (event, author, msg, color, date) => {
    console.log(author, msg, color, date);
    /* self */
    let itemList = $("<li>",{
        class:(myColor == color && author == username)?"self":"other"
    });
    let message = $('<div>',{
        class:"msg"
    });
    let user = $("<div>",{
        class:"user",
        text:author
    });
    let text = $("<p>",{
        text:msg
    });
    let time = $("<time>", {
        text:dateFormat(date, "HH:MM:ss")
    });
    message.append(user);
    message.append(text);
    message.append(time);
    itemList.append(message);
    listMessageDom.append(itemList);
    $("html, body").animate({ scrollTop: $(document).height() }, "fast");
});
ipc.on("color", (event, arg) => {
    myColor = arg;
});
ipc.on("connected", ()=>{
console.log("connected");
});
ipc.on("connectedPeople",(event, list) => {
    $(".members").text((list.length > 1)? list.join(","):"Tu es seul");
});
$(".send").on("click", (e) => {
    e.preventDefault();
    let input =  $(".typezone textarea");

    console.log(input.val());
    if(input.val().length > 0){
        if(username == null){
            ipc.send("username", input.val());
            username = input.val();
            input.attr("placeholder", "Ton message");

        }
        else
        {
            ipc.send("message", input.val());
        }
        input.val("");
    }

});
