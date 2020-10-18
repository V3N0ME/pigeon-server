const { v4: uuidv4 } = require("uuid");
const { decode } = require("./jwt");
const jwt = require("./jwt");

class WebSocketHandler {
  constructor(io, sessionRepo) {
    this.io = io;
    this.sessionRepo = sessionRepo;
    this.activeClients = {};
    this.activeSessions = {};
    this.init();
  }

  init() {
    this.io
      .use(async (socket, next) => {
        const query = socket.handshake.query;
        if (query && query.token) {
          try {
            const decoded = await jwt.verify(query.token);
            socket.userId = decoded.id;
            socket.userName = decoded.name;

            if (this.activeClients[socket.userId]) {
              next(new Error("Client already connected"));
              return;
            }

            next();
          } catch (err) {
            next(new Error("Authentication error"));
          }
        }
      })
      .on("connect", (socket) => {
        this.onConnect(socket);
      });
  }

  onConnect(socket) {
    this.activeClients[socket.userId] = socket.id;
    console.log("Active Clients -", Object.keys(this.activeClients).length);

    const remoteClientId = socket.handshake.query["remoteClientId"];

    let roomId = null;

    //remoteClientId is only sent in video call screen
    if (remoteClientId) {
      if (!this.activeSessions[remoteClientId]) {
        roomId = uuidv4();
      } else {
        roomId = this.activeSessions[remoteClientId];
      }

      this.activeSessions[socket.userId] = roomId;

      socket.join(roomId);
      socket.to(roomId).emit("user-join", {
        socketId: socket.id,
      });

      const socketId = this.activeClients[remoteClientId];
      socket.to(socketId).emit("make-ring", {
        name: socket.userName,
        roomId: socket.userId,
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

    socket.on("zoom", (data) => {
      socket.to(roomId).emit("zoom", {
        socketId: socket.id,
        zoom: data.zoom,
      });
    });

    socket.on("disconnect", () => {
      delete this.activeSessions[socket.userId];
      delete this.activeClients[socket.userId];

      console.log("Active Clients -", Object.keys(this.activeClients).length);
    });
  }
}

module.exports = (io, sessionRepo) => {
  return new WebSocketHandler(io, sessionRepo);
};
