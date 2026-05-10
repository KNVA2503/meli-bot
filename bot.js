// bot.js — Bot de reclutamiento Meli para WhatsApp
// Mercado Libre / Adecco CEDIS Mex06

const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const readline = require('readline');
const { procesarMensaje } = require('./flujo');

// Número del reclutador que recibe notificaciones (con código de país, sin +)
const NUMERO_RECLUTADOR = '527261616412';

function pregunta(texto) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(texto, ans => { rl.close(); resolve(ans.trim()); }));
}

async function iniciarBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info');

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    logger: pino({ level: 'silent' }),
  });

  // Usar código de emparejamiento si no hay sesión guardada
  if (!state.creds.registered) {
    const numero = await pregunta('📱 Ingresa el número de WhatsApp del bot (con código de país, sin +, ej: 5215512345678): ');
    const codigo = await sock.requestPairingCode(numero);
    console.log(`\n✅ Tu código de emparejamiento es: ${codigo}`);
    console.log('👉 En WhatsApp ve a: ⋮ → Dispositivos vinculados → Vincular con número de teléfono');
    console.log('   Ingresa el código de 8 dígitos que aparece arriba\n');
  }

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'close') {
      const debeReconectar = new Boom(lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
      if (debeReconectar) {
        console.log('🔄 Reconectando...');
        iniciarBot();
      } else {
        console.log('👋 Sesión cerrada. Borra la carpeta auth_info y vuelve a correr el bot para reconectar.');
      }
    }

    if (connection === 'open') {
      console.log('✅ Meli está conectada y lista para recibir candidatos!');
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      // Ignorar mensajes propios, de grupos y sin texto
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

        // resultado puede ser string o { mensaje, notificar, resumen }
        const respuesta = typeof resultado === 'string' ? resultado : resultado.mensaje;

        await sock.sendMessage(msg.key.remoteJid, { text: respuesta });
        console.log(`✉️  Respuesta enviada a ${telefono}`);

        // Notificar al reclutador si el candidato completó el registro
        if (resultado.notificar && NUMERO_RECLUTADOR) {
          const notificacion = `🔔 *Nuevo candidato registrado — Mercado Libre CEDIS Mex06*\n\n${resultado.resumen}\n\n_Notificación automática de Meli_`;
          await sock.sendMessage(`${NUMERO_RECLUTADOR}@s.whatsapp.net`, { text: notificacion });
          console.log(`🔔 Reclutador notificado sobre candidato ${telefono}`);
        }

      } catch (err) {
        console.error('Error procesando mensaje:', err);
      }
    }
  });
}

console.log('🤖 Iniciando Meli — Bot de Reclutamiento Mercado Libre...');
iniciarBot();
