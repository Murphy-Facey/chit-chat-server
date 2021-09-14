require("dotenv").config();
require("./config/database").connect();

const app = require("./app");
const Message = require("./models/Message");
const server = require("http").createServer(app);

const PORT = process.env.PORT || "8000";

const io = require("socket.io")(server, { cors: { origin: "*" }});

let online_users = [];

io.on("connection", (socket) => {
  socket.on("message", (data) => {

    let { message, dateSent, chatId, userId } = data;
    new Message({
      message: message,
      date_sent: new Date(dateSent),
      chat_id: chatId,
      user_id: userId
    }).save();
    socket.to(socket.currentChat).emit("sendMessage", data);
  });

  socket.on("updateLatestMessage", (data) => {
    let { message, friendId } = data;

    let friend_socket = online_users.find(user => {
      if(user.userId == friendId) {
        return user;
      }
    });
    
    if(friend_socket != undefined) {
      let userId = online_users.find(user => user.socket.id == socket.id).userId;
      let result = { message, friendId: userId };

      friend_socket.socket.emit("setLatestMessage", result);
    }
  })

  socket.on("online", (data) => {
    console.log("online")
    
    online_users.push({ socket: socket, userId: data });
    
    let uniq_online_users = [... new Set(online_users.map(user => user.userId))]
    
    socket.broadcast.emit("onlineOthers", uniq_online_users);
    if(uniq_online_users.length != 1)
      socket.emit("onlineOthers", uniq_online_users.filter(user => user.userId != data));
  });

  socket.on("joinChat", chat_id => {
    socket.currentChat = chat_id;
    socket.join(chat_id);
  });

  socket.on("offline", () => {
    online_users = online_users.filter(user => user.socket.id != socket.id);
    let uniq_online_users = [... new Set(online_users.map(user => user.userId))]

    socket.broadcast.emit("onlineOthers", uniq_online_users);
  });

  socket.on("disconnect", () => {
    online_users = online_users.filter(user => user.socket.id != socket.id);
    let uniq_online_users = [... new Set(online_users.map(user => user.userId))]

    socket.broadcast.emit("onlineOthers", uniq_online_users);
  })
});



server.listen(PORT, () => {
  console.log("🚀 -- Server is running on http://localhost:" + PORT);
});
