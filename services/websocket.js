const { v4: uuidv4 } = require("uuid");
const jwt = require("./jwt");

class WebSocketHandler {
  constructor(io, sessionRepo) {
    this.io = io;
    this.sessionRepo = sessionRepo;

    this.activeClients = {};
    this.activeSessions = {};
    this.activeOffers = {};

    this.init();
  }

  init() {
    this.io
      .use(async (socket, next) => {
        // const query = socket.handshake.query;
        // if (query && query.token) {
        //   try {
        //     const decoded = await jwt.verify(query.token);
        //     socket.userId = decoded.id;
        //     socket.userName = decoded.name;

        //     if (this.activeClients[socket.userId]) {
        //       next(new Error("Client already connected"));
        //       return;
        //     }

        //     next();
        //   } catch (err) {
        //     next(new Error("Authentication error"));
        //   }
        // }
        socket.userId = Math.random();
        next();
      })
      .on("connect", (socket) => {
        this.onConnect(socket);
      });
  }

  onConnect(socket) {
    this.activeClients[socket.userId] = socket.id;
    console.log("Active Clients -", Object.keys(this.activeClients).length);

      const roomId = "roomId"

      socket.join(roomId);

      // socket.to(roomId).emit("user-join", {
      //   socketId: socket.id,
      // });

      let queuedOffer = null;

      for(const userId in this.activeOffers) {

        console.log("sending offer")

        //socket.emit("onOffer", this.activeOffers[userId]);

        queuedOffer = this.activeOffers[userId]
      }

      socket.emit("init", {
        initiator: Object.keys(this.activeOffers) == 0,
        ...queuedOffer
      });

      socket.on("OnIceCandidate", (data) => {

        console.log("OnIceCandidate")

        socket.to(roomId).emit("OnIceCandidate", data);
      });

      socket.on("OnRemoveCandidates", (data) => {

        console.log("OnRemoveCandidates")

        socket.to(roomId).emit("OnRemoveCandidates", data);
      });

      socket.on("onAnswer", (data) => {

        console.log("onAnswer")

        this.activeOffers[socket.userId] = data;

        socket.to(roomId).emit("onAnswer", data);
      });

      socket.on("onOffer", (data) => {

        console.log("onOffer")

        this.activeOffers[socket.userId] = data;

        socket.to(roomId).emit("onOffer", data);
      });

      socket.on("disconnect", () => {
        delete this.activeSessions[socket.userId];
        delete this.activeClients[socket.userId];
        delete this.activeOffers[socket.userId];
  
        console.log("Active Clients -", Object.keys(this.activeClients).length);
      });

      return

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
