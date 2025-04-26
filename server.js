const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");
const fs = require("fs");
const { createRoom, generateRoomKey } = require("./config/roomManager");
const { handleMessage, handleAudio, handleMessageSeen, createRoomHandler } = require("./config/socketHandler");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// Middleware para servir arquivos estáticos
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

// Certifica-se de que a pasta de uploads existe
if (!fs.existsSync("./uploads")) {
  fs.mkdirSync("./uploads");
}

// Conexões de WebSocket
io.on("connection", (socket) => {
  console.log(`Novo cliente conectado: ${socket.id}`);

  // Entrar em sala e fornecer chave de criptografia
  socket.on("join_room", (room) => {
    createRoom(socket, room, rooms);
  });

  // Enviar mensagem criptografada
  socket.on("send_message", ({ room, message, id }) => {
    handleMessage(socket, room, message, id, rooms, seenStatus, io);
  });

  // Envio de áudio
  socket.on("send_audio", ({ room, audioUrl, username }) => {
    handleAudio(room, audioUrl, username, io);
  });

  // Atualizar status de mensagem visualizada
  socket.on("message_seen", ({ room, id, user }) => {
    handleMessageSeen(id, user, room, seenStatus, io);
  });

  // Criar sala manualmente
  socket.on("create_room", (roomName) => {
    createRoomHandler(socket, roomName, rooms);
  });
});

// Iniciar o servidor
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
