const WebSocket = require('ws');
const { exec } = require('child_process');
require('dotenv').config();

const USERNAME = process.env.USERNAME || 'uroshgranic@gmail.com';
const PASSWORD = process.env.PASSWORD || 'Nicifor91';

if (!USERNAME || !PASSWORD) {
  console.error("❌ USERNAME ili PASSWORD nije definisan.");
  process.exit(1);
}

const processedCodes = new Set();

function runTransaction(code) {
  if (processedCodes.has(code)) {
    console.log(`⚠️ Kod "${code}" je već obrađen.`);
    return;
  }

  console.log(`🚀 Pokrećem transakciju sa kodom: ${code}`);
  processedCodes.add(code);

  setTimeout(() => {
    processedCodes.delete(code);
    console.log(`♻️ Kod "${code}" uklonjen iz memorije posle 24h`);
  }, 24 * 60 * 60 * 1000);

  const command = `node runTransaction.js "${USERNAME}" "${PASSWORD}" "${code}"`;
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Greška: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`⚠️ STDERR: ${stderr}`);
      return;
    }
    console.log(`✔️ Output: ${stdout}`);
  });
}

function connect() {
  let retryCount = 0;

  function establishConnection() {
    const ws = new WebSocket('wss://websocket-telegram-production.up.railway.app');

    ws.on('open', () => {
      retryCount = 0;
      console.log('✅ WebSocket konekcija otvorena');
    });

    ws.on('message', (data) => {
      try {
        const parsed = JSON.parse(data);
        console.log('📨 Primljena poruka:', parsed);

        if (parsed.type === 'new_code' && parsed.code) {
          runTransaction(parsed.code);
        } else if (parsed.type === 'message') {
          console.log('📢 Poruka:', parsed.message || '(nema poruke)');
        }
      } catch (err) {
        console.error('❌ JSON greška:', err.message);
      }
    });

    ws.on('close', () => {
      retryCount++;
      const delay = Math.min(30000, retryCount * 5000); // max 30 sekundi
      console.log(`❌ WS zatvoren. Pokušavam ponovo za ${delay / 1000}s...`);
      setTimeout(establishConnection, delay);
    });

    ws.on('error', (err) => {
      console.error('⚠️ WebSocket greška:', err.message);
    });
  }

  establishConnection();
}

module.exports = {
  connect
};
