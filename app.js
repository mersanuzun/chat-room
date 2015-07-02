var Room = require("./Room.js");
var User = require("./User.js");
var express = require("express");
var app = express();
app.use(express.static('public'));
var server = require("http").createServer(app);
var io = require("socket.io").listen(server);
var users = {};
var rooms = [];
var userID = 1;
var roomID = 1;
var resultRoom;
var port = 4070 ;
server.listen(port);
console.log("Server is running at", port);
app.use(express.static('public'));
app.get("/", function(req, res){
  res.sendfile(__dirname + "/index.html");
});
io.sockets.on("connection", function(socket){
  socket.on("create-user", function(userName, callback){
    var user = new User(userName, userID++, socket.id);
    users[socket.id] = user;
    updateRooms();
    callback(true)
  })
  socket.on("create-room", function(roomName, callback){
    var room = new Room(roomName, roomID, users[socket.id])
    room.addUser(users[socket.id])
    socket.roomID = roomID;
    rooms.push(room);
    socket.join(socket.roomID);
    updateRooms();
    updateRoomMembers(room);
    roomID++;
    callback(true);
  })
  socket.on("join-room", function(roomID, callback){
    socket.roomID = roomID;
    resultRoom = findRoom(socket.roomID)
    var roomResult = resultRoom.addUser(users[socket.id]);
    if (roomResult == "Room is full"){
      callback(roomResult);
    }else{
      socket.join(socket.roomID);
      updateRoomMembers(resultRoom);
      updateRooms()
      callback(true);
      socket.broadcast.to(socket.roomID).emit("new-user", users[socket.id]);
    }
  })
  socket.on("message", function(message){
    console.log(socket.roomID)
    io.sockets.in(socket.roomID).emit("new-message", {userName : users[socket.id].userName, data : message});
  })
  socket.on("typing", function(){
    socket.broadcast.to(socket.roomID).emit("some-typing", users[socket.id]);
  })
  socket.on("leave-room", function(callback){
    leaveRoom(socket);
    updateRooms();
    callback(true);
  })
  function leaveRoom(){
    socket.leave(socket.roomID);
    var resultRoom = findRoom(socket.roomID)
    if (users[socket.id].userID == resultRoom.owner.userID){
      resultRoom.removeUser(users[socket.id].userID);
      if (resultRoom.members.length > 0) resultRoom.changeOwner(resultRoom.members[0]);
      else{
        removeRoom(resultRoom);
        console.log(rooms);
      }
    }else{
      resultRoom.removeUser(users[socket.id].userID);
    }
    console.log("owner", resultRoom.owner);
    updateRoomMembers(resultRoom);
    io.sockets.in(socket.roomID).emit("left-message", users[socket.id].userName + " left the room<br>");
  }
  function findRoom(roomID){
    for(var index in rooms){
      if (rooms[index].roomID == socket.roomID){
        var resultRoom = rooms[index];
        break;
      }
    }
    return resultRoom;
  }
  function removeRoom(room){
    for(var i=0; i < rooms.length; i++){
      if (rooms[i].roomID == room.roomID){
        rooms.splice(i,1);
        break;
      }
    }
  }
  function updateRoomMembers(room){
    io.sockets.in(socket.roomID).emit("room-members", room.members);
  }
  function updateRooms(){
    io.emit("rooms", rooms);
  }
  socket.on("disconnect", function(){
    leaveRoom();
  })
})
