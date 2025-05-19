const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (_, res) => res.send('🟢 ECEX bot je aktivan!'));

app.listen(PORT, () => {
  console.log(`✅ Keep-alive server pokrenut na portu ${PORT}`);
});

require('./websocket');
