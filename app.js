// app.js
const WebSocketClient = require('./websocket');

let expressActive = false;

try {
  const express = require('express');
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.get('/', (_, res) => res.send('🟢 ECEX bot aktivan (Express)!'));

  app.listen(PORT, () => {
    console.log(`✅ Express server sluša na portu ${PORT}`);
    expressActive = true;
  });
} catch (err) {
  console.warn("⚠️ Express server nije aktiviran:", err.message);
}

// Pokreni WebSocket konekciju
WebSocketClient.connect();

// Fallback "keep-alive" ako Express nije aktivan
setInterval(() => {
  if (!expressActive) {
    console.log('💓 Keep-alive aktivan (bez servera)');
  }
}, 30000);
