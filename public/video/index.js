const constrains = {
  audio: true,
  video: {
    width: "300",
    height: "200",
    frameRate: "15",
  },
  video: true,
};

class Main {
  constructor(roomId) {
    this.roomId = roomId;
    this.init();
  }

  init() {
    this.initDOM();
    this.initLocalStream((stream) => {
      this.initWebSocket();
      this.initCallManager();
      this.callManager.injectStream(stream);
    });
  }

  initDOM() {
    this.msg = document.getElementById("status");
    this.localVideo = document.getElementById("local-video");
    this.remoteVideo = document.getElementById("remote-video");

    //this.remoteVideo.style.width = window.innerWidth + "px";
    //this.remoteVideo.style.height = screen.innerHeight + "px";

    let self = this;

    document.getElementById("mute-button").onclick = function () {
      self.toggleVideoMute();
      if (this.getAttribute("state") === "off") {
        this.src = "images/mic.png";
        this.className = "icon green";
        this.setAttribute("state", "on");
      } else {
        this.src = "images/no-mic.png";
        this.className = "icon red";
        this.setAttribute("state", "off");
      }
    };

    document.getElementById("camera-button").onclick = function () {
      self.toggleVideoCam();
      if (this.getAttribute("state") === "off") {
        this.src = "images/video.png";
        this.className = "icon green";
        this.setAttribute("state", "on");
      } else {
        this.src = "images/no-video.png";
        this.className = "icon red";
        this.setAttribute("state", "off");
      }
    };

    document.getElementById("end-call-button").onclick = () => {
      this.socket.emit("call-disconnect");
      this.disconnect();
    };

    document.getElementById("toggle-layout").onclick = function () {
      self.toggleLayout(this.getAttribute("state"));
      if (this.getAttribute("state") === "layout1") {
        this.src = "images/layout-2.png";
        this.setAttribute("state", "layout2");
      } else {
        this.src = "images/layout-1.png";
        this.setAttribute("state", "layout1");
      }
    };
  }

  disconnect() {
    this.msg.textContent = "Call Disconnected";
    //this.remoteVideo.srcObject = null;
    // setTimeout(() => {
    //   window.location = "../rooms/index.html";
    // }, 2500);
  }

  initWebSocket() {
    const ip = localStorage.getItem("ip");
    this.socket = io("/", {
      query: "roomId=" + this.roomId,
    });
    this.attachWebSocketHandlers();
  }

  initCallManager() {
    this.callManager = new CallManager(
      this.socket,
      this.remoteVideo,
      this.roomId
    );
    this.callManager.onCallEnd((socketId) => {
      this.reConnect(socketId);
    });
  }

  reConnect(socketId) {
    //this.msg.textContent = "Reconnecting";
    this.callManager.callUser(socketId);
  }

  attachWebSocketHandlers() {
    this.socket.on("connect", () => {
      this.msg.textContent = "Online";
    });

    this.socket.on("call-made", (data) => {
      console.log("call-made");
      this.msg.textContent = "In Call";
      this.callManager.createPeer(data.socketId);
      this.callManager.answerCall(data);
    });

    this.socket.on("answer-made", (data) => {
      console.log("answer-made");
      this.msg.textContent = "In Call";
      this.callManager.handleRemoteStream(data);
    });

    this.socket.on("user-join", (data) => {
      console.log("user-join");
      this.callManager.createPeer(data.socketId);
      this.callManager.callUser(data.socketId);
    });

    this.socket.on("call-disconnect", (data) => {
      this.callManager.removePeer(data.socketId);
      //this.disconnect(data.socketId);
    });
  }

  toggleVideoMute() {
    this.localStream.getTracks().forEach((track) => {
      if (track.kind === "audio") {
        if (track.readyState == "live") {
          //track.stop();
          track.enabled = !track.enabled;
        } else if (track.readyState == "ended") {
          track.enabled = true;
        }
      }
    });
  }

  toggleVideoCam() {
    this.localStream.getTracks().forEach((track) => {
      if (track.kind === "video") {
        if (track.readyState == "live") {
          //track.stop();
          track.enabled = !track.enabled;
        } else if (track.readyState == "ended") {
          track.enabled = true;
        }
      }
    });
  }

  initLocalStream(callback) {
    navigator.getUserMedia = navigator.webkitGetUserMedia;
    navigator.getUserMedia(
      constrains,
      (stream) => {
        this.localStream = stream;
        this.localVideo.srcObject = stream;
        callback(stream);
      },
      (error) => {
        this.msg.textContent = error.name;
      }
    );
  }

  toggleLayout(state) {
    if (state === "layout1") {
      this.localVideo.className = "local-video-layout2";
      this.remoteVideo.className = "remote-video-layout2";

      document.getElementById("local-video-container").className =
        "local-video-container-layout2";
      document.getElementById("remote-video-container").className =
        "remote-video-container-layout2";
    } else {
      this.localVideo.className = "local-video-layout1";
      this.remoteVideo.className = "remote-video-layout1";

      document.getElementById("local-video-container").className =
        "local-video-container-layout1";
      document.getElementById("remote-video-container").className =
        "remote-video-container-layout1";
    }
  }
}

var main;

document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const roomId = urlParams.get("roomId");
  main = new Main(roomId);
});
