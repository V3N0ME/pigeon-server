class WebSocketHandler {
  constructor(io, repo) {
    this.io = io;
    this.init();
  }

  init() {
    this.io.on("connect", (socket) => {
      this.onConnect(socket);
    });
  }

  onConnect(socket) {
    console.log("Connected", socket.id);

    const roomId = socket.handshake.query["roomId"];
    socket.join(roomId);

    socket.on("call-user", (data) => {
      socket.broadcast.emit("make-ring", {
        user: "Room - 143",
      });

      socket.to(roomId).emit("call-made", {
        offer: data.offer,
        socket: socket.id,
      });
    });

    socket.on("make-answer", (data) => {
      socket.to(roomId).emit("answer-made", {
        socket: socket.id,
        answer: data.answer,
      });
    });

    socket.on("make-ring", () => {
      socket.to(roomId).emit("make-ring", {
        user: "Room - 143",
      });
    });

    socket.on("disconnect", this.onDisconnect);
  }

  onDisconnect(socket) {
    console.log("Disconnected");
  }
}

module.exports = (io, repo) => {
  return new WebSocketHandler(io, repo);
};
