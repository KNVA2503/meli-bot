// bot.js — Bot de reclutamiento Meli para WhatsApp
const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const readline = require('readline');
const { procesarMensaje } = require('./flujo');

const NUMERO_RECLUTADOR = '527261616412';

function pregunta(texto) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(texto, ans => { rl.close(); resolve(ans.trim()); }));
}

async function iniciarBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info');

  const usarPairingCode = !state.creds.registered;
  let numeroBot = '';

  if (usarPairingCode) {
    numeroBot = await pregunta('📱 Número de WhatsApp del bot (sin +, ej: 5215512345678): ');
  }

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    logger: pino({ level: 'silent' }),
  });

  sock.ev.on('creds.update', saveCreds);

  // Solicitar pairing code cuando el socket está listo
  if (usarPairingCode) {
    setTimeout(async () => {
      try {
        const codigo = await sock.requestPairingCode(numeroBot);
        console.log(`\n🔑 Código de emparejamiento: ${codigo}`);
        console.log('👉 WhatsApp → ⋮ → Dispositivos vinculados → Vincular con número de teléfono');
        console.log('   Ingresa ese código de 8 dígitos\n');
      } catch (e) {
        console.log('No se pudo obtener el código. Reinicia con: rmdir /s /q auth_info && node bot.js');
      }
    }, 3000);
  }

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'close') {
      const debeReconectar = new Boom(lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
      if (debeReconectar) {
        console.log('🔄 Reconectando...');
        iniciarBot();
      } else {
        console.log('👋 Sesión cerrada. Ejecuta: rmdir /s /q auth_info && node bot.js');
      }
    }

    if (connection === 'open') {
      console.log('✅ Meli está conectada y lista para recibir candidatos!');
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      if (msg.key.fromMe) continue;
      if (msg.key.remoteJid.includes('@g.us')) continue;

      const telefono = msg.key.remoteJid.replace('@s.whatsapp.net', '');
      const texto = msg.message?.conversation
        || msg.message?.extendedTextMessage?.text
        || '';

      if (!texto) continue;

      console.log(`📩 Mensaje de ${telefono}: ${texto}`);

      try {
        const resultado = procesarMensaje(telefono, texto);
        const respuesta = typeof resultado === 'string' ? resultado : resultado.mensaje;

        await sock.sendMessage(msg.key.remoteJid, { text: respuesta });
        console.log(`✉️  Respuesta enviada`);

        if (resultado.notificar && NUMERO_RECLUTADOR) {
          const notificacion = `🔔 *Nuevo candidato — Mercado Libre CEDIS Mex06*\n\n${resultado.resumen}\n\n_Notificación automática de Meli_`;
          await sock.sendMessage(`${NUMERO_RECLUTADOR}@s.whatsapp.net`, { text: notificacion });
          console.log(`🔔 Reclutador notificado`);
        }
      } catch (err) {
        console.error('Error:', err.message);
      }
    }
  });
}

console.log('🤖 Iniciando Meli — Bot de Reclutamiento Mercado Libre...');
iniciarBot();
