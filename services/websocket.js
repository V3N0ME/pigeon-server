const { v4: uuidv4 } = require("uuid")
const jwt = require("./jwt")

class WebSocketHandler {
  constructor (io, sessionRepo) {
    this.io = io
    this.sessionRepo = sessionRepo

    this.activeClients = {}
    this.activeSessions = {}
    this.activeOffers = {}
    this.activeIceCandidates = {}

    this.init()
  }

  init () {
    this.io
      .use(async (socket, next) => {
        const query = socket.handshake.query
        socket.roomId = query.room_id
        socket.userName = query.user_name
        socket.userId = socket.id
        next()
      })
      .on("connect", socket => {
        this.onConnect(socket)
      })
  }

  onConnect (socket) {
    this.activeClients[socket.userId] = socket.id
    console.log("Active Clients -", Object.keys(this.activeClients).length)

    const roomId = socket.roomId

    socket.join(roomId)

    const users = []

    for (const userId in this.activeClients) {
      users.push(userId)
    }

    socket.emit("onUsersList", {
      users: users
    })

    socket.to(roomId).emit("onUserJoin", {
      userId: socket.userId,
      userName: socket.userName
    })

    // let queuedOffer = null

    // for (const userId in this.activeOffers) {
    //   //console.log("sending offer")

    //   //socket.emit("onOffer", this.activeOffers[userId]);

    //   queuedOffer = this.activeOffers[userId]
    // }

    // socket.emit("init", {
    //   initiator: Object.keys(this.activeOffers) == 0,
    //   "icecandidates": this.activeIceCandidates[socket.id],
    //   ...queuedOffer
    // });

    socket.on("OnIceCandidate", data => {
      console.log("OnIceCandidate")

      // if (!this.activeIceCandidates[socket.id]) {
      //   this.activeIceCandidates[socket.id] = []
      // }

      // this.activeIceCandidates[socket.id].push(data)

      data.userId = socket.userId

      socket.to(roomId).emit("OnIceCandidate", data)
    })

    socket.on("OnRemoveCandidates", data => {
      console.log("OnRemoveCandidates")

      socket.to(roomId).emit("OnRemoveCandidates", data)
    })

    socket.on("onAnswer", data => {
      console.log("onAnswer")

      //this.activeOffers[socket.userId] = data

      const receiverId = data.userId

      const forwardingAnswer = { ...data }
      forwardingAnswer.userId = socket.userId

      socket.to(receiverId).emit("onAnswer", forwardingAnswer)
    })

    socket.on("onOffer", data => {
      console.log("onOffer")

      const receiverId = data.userId

      const forwardingOffer = { ...data }
      forwardingOffer.userId = socket.userId

      socket.to(receiverId).emit("onOffer", forwardingOffer)
    })

    socket.on("disconnect", () => {
      delete this.activeSessions[socket.userId]
      delete this.activeClients[socket.userId]
      delete this.activeOffers[socket.userId]
      delete this.activeIceCandidates[socket.userId]

      socket.to(roomId).emit("onUserLeave", {
        userId: socket.userId,
        userName: socket.userName
      })

      console.log("Active Clients -", Object.keys(this.activeClients).length)
    })

    return

    socket.on("make-answer", data => {
      socket.to(data.socketId).emit("answer-made", {
        socketId: socket.id,
        answer: data.answer
      })
    })

    socket.on("call-disconnect", () => {
      socket.to(roomId).emit("call-disconnect", {
        socketId: socket.id
      })
    })

    socket.on("speaking", () => {
      socket.to(roomId).emit("speaking", {
        socketId: socket.id
      })
    })

    socket.on("zoom", data => {
      socket.to(roomId).emit("zoom", {
        socketId: socket.id,
        zoom: data.zoom
      })
    })

    socket.on("disconnect", () => {
      delete this.activeSessions[socket.userId]
      delete this.activeClients[socket.userId]

      console.log("Active Clients -", Object.keys(this.activeClients).length)
    })
  }
}

module.exports = (io, sessionRepo) => {
  return new WebSocketHandler(io, sessionRepo)
}
