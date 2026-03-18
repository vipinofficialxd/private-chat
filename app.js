const ws = new WebSocket("ws://localhost:3001");

let peer = new RTCPeerConnection();
let channel;

// Receive data channel
peer.ondatachannel = (event) => {
  channel = event.channel;

  channel.onmessage = (e) => {
    addMessage("Other: " + e.data);
  };
};

// ICE candidate send
peer.onicecandidate = (event) => {
  if (event.candidate) {
    ws.send(JSON.stringify({
      type: "signal",
      data: { candidate: event.candidate }
    }));
  }
};

// Receive signaling data
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

  // Create data channel
  channel = peer.createDataChannel("chat");

  channel.onmessage = (e) => {
    addMessage("Other: " + e.data);
  };

  startConnection();
}

// Start connection (offer)
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