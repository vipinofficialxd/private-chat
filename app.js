const ws = new WebSocket("ws://20.219.1.156:3001");

let peer = new RTCPeerConnection({
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject"
    }
  ]
});

let channel;

// Receive channel
peer.ondatachannel = (event) => {
  channel = event.channel;

  channel.onmessage = (e) => {
    addMessage("Other: " + e.data);
  };
};

// ICE candidates
peer.onicecandidate = (event) => {
  if (event.candidate) {
    ws.send(JSON.stringify({
      type: "signal",
      data: { candidate: event.candidate }
    }));
  }
};

// Receive signals
ws.onmessage = async (message) => {
  const msg = JSON.parse(message.data);

  if (msg.data.offer) {
    await peer.setRemoteDescription(new RTCSessionDescription(msg.data.offer));

    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);

    ws.send(JSON.stringify({
      type: "signal",
      data: { answer: answer }
    }));
  }

  if (msg.data.answer) {
    await peer.setRemoteDescription(new RTCSessionDescription(msg.data.answer));
  }

  if (msg.data.candidate) {
    await peer.addIceCandidate(new RTCIceCandidate(msg.data.candidate));
  }
};

// Join room
function joinRoom() {
  const room = document.getElementById("room").value;

  ws.send(JSON.stringify({
    type: "join",
    room: room
  }));

  channel = peer.createDataChannel("chat");

  channel.onmessage = (e) => {
    addMessage("Other: " + e.data);
  };

  startConnection();
}

// Create offer
async function startConnection() {
  const offer = await peer.createOffer();
  await peer.setLocalDescription(offer);

  ws.send(JSON.stringify({
    type: "signal",
    data: { offer: offer }
  }));
}

// Send message
function sendMessage() {
  const msg = document.getElementById("msg").value;
  channel.send(msg);
  addMessage("You: " + msg);
}

// Show message
function addMessage(text) {
  const li = document.createElement("li");
  li.textContent = text;
  document.getElementById("chat").appendChild(li);
}
