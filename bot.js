// bot.js — Bot de reclutamiento Meli usando whatsapp-web.js
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const express = require('express');
const { procesarMensaje } = require('./flujo');

const NUMERO_RECLUTADOR = '527261616412@c.us';

// Servidor web para mostrar el QR
const app = express();
let qrActual = '';

app.get('/', (req, res) => {
  if (!qrActual) {
    res.send('<h2>Esperando QR... recarga en unos segundos</h2><script>setTimeout(()=>location.reload(),3000)</script>');
    return;
  }
  res.send(`
    <!DOCTYPE html>
    <html>
    <head><title>Meli Bot — Escanea el QR</title></head>
    <body style="display:flex;flex-direction:column;align-items:center;font-family:Arial;padding:20px">
      <h2>📱 Escanea con WhatsApp</h2>
      <p>WhatsApp → ⋮ → Dispositivos vinculados → Vincular dispositivo</p>
      <img id="qr" src="/qr.png" style="width:300px;border:2px solid #ccc;border-radius:8px">
      <p style="color:gray">La página se recarga automáticamente si el QR expira</p>
      <script>setTimeout(()=>location.reload(),30000)</script>
    </body>
    </html>
  `);
});

app.get('/qr.png', async (req, res) => {
  if (!qrActual) return res.status(404).send('Sin QR');
  const buf = await qrcode.toBuffer(qrActual);
  res.type('png').send(buf);
});

app.listen(3000, () => {
  console.log('🌐 Abre en tu navegador: http://localhost:3000');
  console.log('   Escanea el QR con WhatsApp para conectar a Meli\n');
});

// Cliente de WhatsApp
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

client.on('qr', (qr) => {
  qrActual = qr;
  console.log('📱 QR listo — abre http://localhost:3000 en tu navegador');
});

client.on('ready', () => {
  qrActual = '';
  console.log('✅ Meli está conectada y lista para recibir candidatos!');
});

client.on('disconnected', (reason) => {
  console.log('❌ Meli desconectada:', reason);
  console.log('🔄 Reiniciando...');
  client.initialize();
});

client.on('message', async (msg) => {
  // Ignorar mensajes de grupos y estados
  if (msg.from.includes('@g.us') || msg.from === 'status@broadcast') return;

  const telefono = msg.from.replace('@c.us', '');
  const texto = msg.body;

  if (!texto) return;

  console.log(`📩 Mensaje de ${telefono}: ${texto}`);

  try {
    const resultado = procesarMensaje(telefono, texto);
    const respuesta = typeof resultado === 'string' ? resultado : resultado.mensaje;

    await msg.reply(respuesta);
    console.log(`✉️  Respuesta enviada a ${telefono}`);

    // Notificar al reclutador cuando se registre un candidato
    if (resultado.notificar) {
      const notificacion = `🔔 *Nuevo candidato — Mercado Libre CEDIS Mex06*\n\n${resultado.resumen}\n\n_Notificación automática de Meli_`;
      await client.sendMessage(NUMERO_RECLUTADOR, notificacion);
      console.log(`🔔 Reclutador notificado`);
    }
  } catch (err) {
    console.error('Error procesando mensaje:', err.message);
  }
});

console.log('🤖 Iniciando Meli — Bot de Reclutamiento Mercado Libre...');
client.initialize();
