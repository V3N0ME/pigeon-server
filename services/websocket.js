class WebSocketHandler {
  constructor(io, repo) {
    this.io = io;
    this.activeClients = {};
    this.init();
  }

  init() {
    this.io.on("connect", (socket) => {
      this.onConnect(socket);
    });
  }

  onConnect(socket) {
    console.log("Connected", socket.id);

    this.activeClients[socket.id] = true;
    console.log("Active Clients -", Object.keys(this.activeClients).length);

    const roomId = socket.handshake.query["roomId"];

    socket.join(roomId);
    socket.to(roomId).emit("user-join", {
      socketId: socket.id,
    });

    if (roomId) {
      socket.broadcast.emit("make-ring", {
        roomId: roomId,
      });
    }

    socket.on("call-user", (data) => {
      socket.to(data.socketId).emit("call-made", {
        offer: data.offer,
        socketId: socket.id,
      });
    });

    socket.on("make-answer", (data) => {
      socket.to(data.socketId).emit("answer-made", {
        socketId: socket.id,
        answer: data.answer,
      });
    });

    socket.on("call-disconnect", () => {
      socket.to(roomId).emit("call-disconnect", {
        socketId: socket.id,
      });
    });

    socket.on("speaking", () => {
      socket.to(roomId).emit("speaking", {
        socketId: socket.id,
      });
    });

    socket.on("disconnect", () => {
      delete this.activeClients[socket.id];

      console.log("Active Clients -", Object.keys(this.activeClients).length);
    });
  }
}

module.exports = (io, repo) => {
  return new WebSocketHandler(io, repo);
};
