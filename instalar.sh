#!/bin/bash
# instalar.sh — Script de instalación de Meli Bot en Termux
# Ejecutar con: bash instalar.sh

echo "🤖 Instalando Meli Bot de Reclutamiento..."
echo ""

# Actualizar paquetes
pkg update -y && pkg upgrade -y

# Instalar Node.js y git
pkg install -y nodejs git

echo ""
echo "✅ Node.js instalado: $(node --version)"
echo ""

# Instalar dependencias del bot
npm install

echo ""
echo "✅ Dependencias instaladas"
echo ""
echo "================================================"
echo "  Meli Bot instalado correctamente!"
echo "================================================"
echo ""
echo "Para iniciar el bot, ejecuta:"
echo "  node bot.js"
echo ""
echo "Escanea el QR que aparece con tu WhatsApp."
echo "================================================"
