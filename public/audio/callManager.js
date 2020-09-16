const { RTCPeerConnection, RTCSessionDescription } = window;

//let peerConnection = null;

class CallManager {
  constructor(socket, remoteVideo, roomId) {
    this.socket = socket;
    this.remoteVideo = remoteVideo;
    this.roomId = roomId;
    this.callInProgress = {};

    this.connectedPeers = {};
  }

  createPeer(socketId, userName) {
    if (this.connectedPeers[socketId]) {
      return;
    }

    const peerConnection = new RTCPeerConnection();

    this.streams = {};

    peerConnection.ontrack = ({ streams: [stream] }) => {
      if (this.streams[stream.id]) {
        return;
      }

      this.streams[stream.id] = true;

      const video = document.createElement("video");
      video.className = "remote-video";
      video.id = "socket-" + socketId;
      video.srcObject = stream;
      video.autoplay = true;
      document.getElementById("remote-video-container").appendChild(video);
    };

    peerConnection.onconnectionstatechange = (state) => {
      if (state.target.iceConnectionState === "disconnected") {
        document.getElementById("socket-" + socketId).remove();
        this.endCall(socketId);
      }
    };

    peerConnection.userName = userName;
    this.connectedPeers[socketId] = peerConnection;
    this.addStream(socketId);
  }

  removePeer(socketId) {
    this.connectedPeers[socketId].close();
    delete this.connectedPeers[socketId];
    document.getElementById("socket-" + socketId).remove();
  }

  onCallEnd(onCallEnd) {
    this.onCallEnd = onCallEnd;
  }

  callUser(socketId) {
    console.log("ANSWER_CALL", socketId);
    return new Promise(async (resolve, reject) => {
      try {
        const offer = await this.connectedPeers[socketId].createOffer();
        await this.connectedPeers[socketId].setLocalDescription(
          new RTCSessionDescription(offer)
        );
        this.socket.emit("call-user", {
          offer,
          socketId: socketId,
          roomId: this.roomId,
        });
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  answerCall(data) {
    console.log("ANSWER_CALL", data.socketId);
    return new Promise(async (resolve, reject) => {
      try {
        await this.connectedPeers[data.socketId].setRemoteDescription(
          new RTCSessionDescription(data.offer)
        );
        const answer = await this.connectedPeers[data.socketId].createAnswer();
        await this.connectedPeers[data.socketId].setLocalDescription(
          new RTCSessionDescription(answer)
        );
        this.socket.emit("make-answer", {
          answer,
          socketId: data.socketId,
        });
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  handleRemoteStream(data) {
    console.log("HANDLE", data.socketId);

    return new Promise(async (resolve, reject) => {
      try {
        await this.connectedPeers[data.socketId].setRemoteDescription(
          new RTCSessionDescription(data.answer)
        );

        console.log("CONDITION", this.callInProgress[data.socketId] !== true);

        if (this.callInProgress[data.socketId] !== true) {
          this.callUser(data.socketId);
          this.callInProgress[data.socketId] = true;
        }

        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  endCall(socketId) {
    this.callInProgress[socketId] = false;
    this.connectedPeers[socketId].close();
    delete this.connectedPeers[socketId];
    //this.connectedPeers[socketId] = new RTCPeerConnection();
    //this.initPeer();
    // this.localStream
    //   .getTracks()
    //   .forEach((track) =>
    //     this.connectedPeers[socketId].addTrack(track, this.localStream)
    //   );
    if (this.onCallEnd) {
      this.onCallEnd(socketId);
    }
  }

  injectStream(stream) {
    this.localStream = stream;
  }

  addStream(socketId) {
    const stream = this.localStream;
    stream
      .getTracks()
      .forEach((track) =>
        this.connectedPeers[socketId].addTrack(track, stream)
      );
  }
}
