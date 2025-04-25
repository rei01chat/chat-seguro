const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const crypto = require("crypto");
const cors = require("cors");

// Usando CORS para permitir conexões de diferentes origens
app.use(cors());

// Servindo arquivos estáticos da pasta 'public'
app.use(express.static("public"));

// Porta dinâmica para produção (Railway, Heroku, etc.)
const PORT = process.env.PORT || 3000; // Se não for fornecida, usará a porta 3000

const rooms = {};
const seenStatus = {};

io.on("connection", socket => {
  console.log("Novo cliente conectado", socket.id);

  // Entrando em uma sala
  socket.on("join_room", room => {
    console.log(`Cliente ${socket.id} entrou na sala ${room}`);
    socket.join(room);

    if (!rooms[room]) {
      rooms[room] = crypto.randomBytes(32).toString("hex");
    }

    socket.emit("key", rooms[room]);
  });

  // Enviando mensagem
  socket.on("send_message", ({ room, message, id }) => {
    console.log(`Mensagem recebida na sala ${room}: ${message}`);
    seenStatus[id] = []; // Inicia lista de quem viu
    socket.to(room).emit("receive_message", message);
  });

  // Atualizando quem viu a mensagem
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

http.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

