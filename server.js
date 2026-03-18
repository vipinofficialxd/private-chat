const WebSocket = require("ws");

const PORT = process.env.PORT || 3001;

const wss = new WebSocket.Server({ port: PORT });

let rooms = {};

wss.on("connection", (ws) => {
  ws.on("message", (message) => {
    const data = JSON.parse(message);

    if (data.type === "join") {
      const room = data.room;

      if (!rooms[room]) rooms[room] = [];
      rooms[room].push(ws);

      ws.room = room;
    }

    if (data.type === "signal") {
      rooms[ws.room].forEach(client => {
        if (client !== ws) {
          client.send(JSON.stringify(data));
        }
      });
    }
  });
});

console.log("Server running...");