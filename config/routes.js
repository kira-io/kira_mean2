// var users = require('./../server/controllers/users.js');
// var user_session_id = null;
// var users_data = {};
// var answers = [];
// var geek_messages = [];
// var artist_messages = [];

module.exports = function Routes(app, io){

    io.configure(function(){
      io.set("transports", ["xhr-polling"]);
      io.set("polling duration", 10);
    }):
    io.sockets.on('connection', function(socket) {
      socket.on('in_all_posts', function(data){
        console.log('IN ALL POSTS', socket.rooms);
      });

      socket.on('client:join_room', function(data) {
        if (socket.rooms.length > 1 && socket.rooms[1] != data.room) {
          console.log('LEAVING ROOM', socket.rooms[1]);
          socket.leave(socket.rooms[1]);
          socket.join(data.room);

        } else {
          socket.join(data.room);
        }
        var namespace = '/';
        var roomName = data.room;
        var users_in_room = 0;

        for (var socketId in io.nsps[namespace].adapter.rooms[roomName]){
          console.log(socketId);
          users_in_room++;
        }
        io.to(data.room).emit('server:new_user', {name: data.name, num_users: users_in_room, socket_id: socket.id});
      });

      socket.on('room_count', function(data){
        var namespace = '/';
        var roomName = data.room;
        var users_in_room = 0;
        console.log('socket', socket.id)

        for (var socketId in io.nsps[namespace].adapter.rooms[roomName]){
          console.log(socketId);
          users_in_room++;
        }
        socket.emit('room_count1', {name: data.name, num_users: users_in_room, socket_id: socket.id});
      });

      socket.on('client:join_room_from_reload', function(data) {
        if (socket.rooms.length > 1 && socket.rooms[1] != data.room){
          console.log('LEAVING ROOM', socket.rooms[1]);
          socket.leave(socket.rooms[1]);
          socket.join(data.room);
        } else {
          socket.join(data.room);
        }
      });

      socket.on('client:emit_message', function(data) {
          console.log('Client has emitted this message', data);
          io.to(data.room).emit('server:incoming_message', { name: data.name, message: data.message });
      });

      socket.on('client:give_joy', function(data) {
        console.log('client clicked on', data.id);
        socket.broadcast.emit('server:update_joys', { post: data.id });
      });

      socket.on('client:limbo_room', function (data){
        io.emit('server:expired_room', {room_num: data.room_number})
      });

      socket.on('client:send_user_name', function(data){
        socket.emit('server:user_name', {name: data.name, id: data.id, socket_id: socket.id}) //
      });

      socket.on('client:message_sent_to', function(data){
          socket.broadcast.emit('server:message_sent_to', {user_id: data.user_id})
      });

      socket.on('client:leave_room', function(data){
        var current_room = socket.rooms[1];
        socket.leave(current_room);
        var namespace = '/';
        var roomName = current_room;
        var users_in_room = 0;

        for (var socketId in io.nsps[namespace].adapter.rooms[roomName]){
          console.log(socketId);
          users_in_room++;
        }
        console.log("CLIENT:LEAVE_ROOM", data)
        io.to(current_room).emit('server:client_exit', {name: data.name, num_users: users_in_room})
      });
      
      socket.on('disconnect', function(data) {
        socket.disconnect();
        socket.leave(data.room);
      });
  });
};

