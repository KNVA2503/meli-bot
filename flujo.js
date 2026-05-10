// flujo.js — Flujo predefinido de reclutamiento Mercado Libre

const ESTADOS = {
  INICIO: 'inicio',
  NOMBRE: 'nombre',
  EDAD: 'edad',
  ESCOLARIDAD: 'escolaridad',
  TURNO: 'turno',
  CONFIRMACION: 'confirmacion',
  FIN: 'fin',
};

// Candidatos en conversación activa: { telefono: { estado, datos } }
const sesiones = {};

function obtenerSesion(telefono) {
  if (!sesiones[telefono]) {
    sesiones[telefono] = { estado: ESTADOS.INICIO, datos: {} };
  }
  return sesiones[telefono];
}

function reiniciarSesion(telefono) {
  sesiones[telefono] = { estado: ESTADOS.INICIO, datos: {} };
}

const TURNOS = `
🌅 *1° Matutino A* — 6:30am a 3:30pm | Descanso: Dom y Lun
🌅 *1° Matutino B* — 6:30am a 3:30pm | Descanso: Vie y Sáb
🌇 *2° Vespertino A* — 12:40pm a 9:40pm | Descanso: Dom y Lun
🌇 *2° Vespertino B* — 12:40pm a 9:40pm | Descanso: Vie y Sáb
🌙 *3° Nocturno A* — 9:40pm a 6:00am | Descanso: Dom y Lun
🌙 *3° Nocturno B* — 9:40pm a 6:00am | Descanso: Vie y Sáb
☀️ *Mixto Día* — 10:00am a 8:00pm | Descanso: Mar, Mié y Jue
🌃 *Mixto Noche* — 8:00pm a 6:00am | Descanso: Mar, Mié y Jue`;

const DOCUMENTOS = `
📋 *Documentos que debes traer:*

1️⃣ Acta de nacimiento (copia)
2️⃣ INE / Identificación oficial (original y copia)
3️⃣ CURP actualizado
4️⃣ Comprobante de estudios (secundaria en adelante)
5️⃣ Asignación NSS (no mayor a 3 meses)
6️⃣ RFC
7️⃣ Comprobante de domicilio (no mayor a 3 meses)
8️⃣ CLABE interbancaria (estado de cuenta legible)

⚠️ Si presentas Acuse de Situación Fiscal, debe tener menos de 3 meses de antigüedad.`;

const PROCESO = `
✅ *El proceso es el mismo día:*

1️⃣ Entrevista en CEDIS
2️⃣ Examen médico
3️⃣ Validación de documentos
4️⃣ ¡Firma y contratación! 🎉`;

function procesarMensaje(telefono, texto) {
  const sesion = obtenerSesion(telefono);
  const msg = texto.trim().toLowerCase();

  // Reiniciar con palabra clave
  if (msg === 'hola' || msg === 'inicio' || msg === 'reiniciar' || msg === 'menu') {
    reiniciarSesion(telefono);
    sesion.estado = ESTADOS.NOMBRE;
    return `¡Hola! 👋 Soy *Meli*, asistente de reclutamiento de *Mercado Libre / Adecco CEDIS Mex06*.

Estoy aquí para ayudarte a postularte como *Auxiliar de Almacén*. El proceso es rápido y puedes entrar ¡el mismo día! 🚀

Para comenzar, ¿cuál es tu nombre completo?`;
  }

  switch (sesion.estado) {

    case ESTADOS.INICIO:
      sesion.estado = ESTADOS.NOMBRE;
      return `¡Hola! 👋 Soy *Meli*, asistente de reclutamiento de *Mercado Libre / Adecco CEDIS Mex06*.

Estoy aquí para ayudarte a postularte como *Auxiliar de Almacén*. El proceso es rápido y puedes entrar ¡el mismo día! 🚀

Para comenzar, ¿cuál es tu nombre completo?`;

    case ESTADOS.NOMBRE: {
      if (texto.trim().length < 3) {
        return '¿Podrías decirme tu nombre completo, por favor? 😊';
      }
      sesion.datos.nombre = texto.trim();
      sesion.estado = ESTADOS.EDAD;
      return `Mucho gusto, *${sesion.datos.nombre}* 😊

¿Cuántos años tienes?`;
    }

    case ESTADOS.EDAD: {
      const edad = parseInt(msg);
      if (isNaN(edad)) {
        return 'Por favor dime tu edad en número, por ejemplo: *25*';
      }
      if (edad < 18 || edad > 55) {
        reiniciarSesion(telefono);
        return `Gracias por tu interés, ${sesion.datos.nombre} 🙏

Lamentablemente la vacante es para candidatos de *18 a 55 años*. En este momento no podemos continuar con tu postulación.

¡Te deseamos mucho éxito! 🍀`;
      }
      sesion.datos.edad = edad;
      sesion.estado = ESTADOS.ESCOLARIDAD;
      return `¡Perfecto! ${edad} años ✅

¿Cuál es tu nivel de escolaridad?
(Ej: Secundaria, Preparatoria, Carrera técnica, Universidad)`;
    }

    case ESTADOS.ESCOLARIDAD: {
      const nivelesValidos = ['secundaria', 'prepa', 'preparatoria', 'bachillerato',
        'tecnico', 'técnico', 'carrera', 'universidad', 'licenciatura', 'ingenieria', 'ingeniería'];
      const tieneEscolaridad = nivelesValidos.some(n => msg.includes(n));

      if (!tieneEscolaridad && msg.length < 5) {
        return 'Por favor indícame tu nivel de estudios 📚 (Ej: Secundaria, Preparatoria, Universidad)';
      }
      sesion.datos.escolaridad = texto.trim();
      sesion.estado = ESTADOS.TURNO;
      return `${sesion.datos.escolaridad} ✅ Cumples con el requisito de escolaridad 🎉

Tenemos estos turnos disponibles:
${TURNOS}

¿Cuál turno te interesa o se adapta mejor a ti?`;
    }

    case ESTADOS.TURNO: {
      if (texto.trim().length < 3) {
        return `Por favor elige uno de los turnos disponibles:${TURNOS}`;
      }
      sesion.datos.turno = texto.trim();
      sesion.estado = ESTADOS.CONFIRMACION;
      return `Excelente elección 👍

Déjame confirmar tus datos:

👤 *Nombre:* ${sesion.datos.nombre}
🎂 *Edad:* ${sesion.datos.edad} años
📚 *Escolaridad:* ${sesion.datos.escolaridad}
🕐 *Turno:* ${sesion.datos.turno}
${PROCESO}
${DOCUMENTOS}

¿Confirmas que quieres continuar con tu postulación? Responde *SÍ* para agendar tu entrevista en CEDIS Mex06 con Isabel Villegas 📅`;
    }

    case ESTADOS.CONFIRMACION: {
      if (msg.includes('si') || msg.includes('sí') || msg === 's' || msg.includes('confirm') || msg.includes('claro') || msg.includes('ok')) {
        sesion.estado = ESTADOS.FIN;
        const resumen = `📋 NUEVO CANDIDATO\n👤 ${sesion.datos.nombre}\n📱 ${telefono}\n🎂 ${sesion.datos.edad} años\n📚 ${sesion.datos.escolaridad}\n🕐 Turno: ${sesion.datos.turno}`;
        // Guardar candidato
        guardarCandidato(sesion.datos, telefono);
        return {
          mensaje: `¡Perfecto, ${sesion.datos.nombre}! 🎉

Tu postulación ha sido *registrada con éxito*.

📍 *Preséntate en CEDIS Mex06* con tus documentos cuando gustes, de *lunes a domingo*.

Tu reclutadora es *Isabel Villegas* de Adecco, quien te atenderá el mismo día.

¡Mucho éxito! 🍀 Estamos seguros de que serás una gran parte del equipo de Mercado Libre.

_Escribe *hola* si tienes más preguntas._`,
          notificar: true,
          resumen
        };
      } else if (msg.includes('no') || msg === 'n') {
        reiniciarSesion(telefono);
        return `Entendido 😊 No hay problema. Si en otro momento deseas postularte, escribe *hola* y con gusto te ayudo.

¡Que tengas un excelente día! 🌟`;
      } else {
        return 'Por favor responde *SÍ* para confirmar tu postulación o *NO* para cancelar.';
      }
    }

    case ESTADOS.FIN:
      return `Hola de nuevo ${sesion.datos.nombre} 😊 Tu postulación ya está registrada.

Si tienes alguna duda, preséntate directamente en *CEDIS Mex06* con Isabel Villegas.

Escribe *hola* para iniciar una nueva postulación.`;

    default:
      reiniciarSesion(telefono);
      return '¡Hola! Escribe *hola* para iniciar tu postulación como Auxiliar de Almacén en Mercado Libre 👋';
  }
}

function guardarCandidato(datos, telefono) {
  const fs = require('fs');
  const fecha = new Date().toLocaleString('es-MX');
  const linea = `[${fecha}] Nombre: ${datos.nombre} | Tel: ${telefono} | Edad: ${datos.edad} | Escolaridad: ${datos.escolaridad} | Turno: ${datos.turno}\n`;
  fs.appendFileSync('candidatos.txt', linea, 'utf8');
}

module.exports = { procesarMensaje };
