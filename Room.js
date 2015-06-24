function Room(roomName, roomID, owner){
  this.roomID = roomID;
  this.roomName = roomName;
  this.owner = owner;
  this.members = [];
}
Room.prototype.roomLimit = 1;
Room.prototype.addUser = function(user){
  if (this.roomLimit == 0){
    return "Room is full";
  }else{
    this.members.push(user);
    this.roomLimit--;
  }

}
Room.prototype.removeUser = function(userID){
  for(var i = 0; i < this.members.length; i++){
    if (this.members[i].userID == userID){
      this.members.splice(i,1);
      break;
    }
  }
  this.roomLimit++;
}
module.exports = Room;
