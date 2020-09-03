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

    socket.on("call-user", (data) => {
      socket.broadcast.emit("make-ring", {
        user: "Room - 143",
      });

      socket.broadcast.emit("call-made", {
        offer: data.offer,
        socket: socket.id,
      });
    });

    socket.on("make-answer", (data) => {
      socket.broadcast.emit("answer-made", {
        socket: socket.id,
        answer: data.answer,
      });
    });

    socket.on("make-ring", () => {
      socket.broadcast.emit("make-ring", {
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
