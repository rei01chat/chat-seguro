const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const crypto = require("crypto");

app.use(express.static("public"));

const rooms = {};
const seenStatus = {};

io.on("connection", socket => {
  socket.on("join_room", room => {
    socket.join(room);

    if (!rooms[room]) {
      rooms[room] = crypto.randomBytes(32).toString("hex");
    }

    socket.emit("key", rooms[room]);
  });

  socket.on("send_message", ({ room, message, id }) => {
    seenStatus[id] = []; // Inicia lista de quem viu
    socket.to(room).emit("receive_message", message);
  });

  socket.on("message_seen", ({ room, id, user }) => {
    if (!seenStatus[id]) {
      seenStatus[id] = [];
    }

    if (!seenStatus[id].includes(user)) {
      seenStatus[id].push(user);
      io.to(room).emit("update_seen", { id, user });
    }
  });
});

http.listen(3000, () => {
  console.log("Servidor rodando na porta 3000");
});
