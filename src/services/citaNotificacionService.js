const toFechaLargaMayus = (fechaISO) => {
  if (!fechaISO) return '—';
  return new Date(`${fechaISO}T12:00:00`).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC'
  }).toUpperCase();
};

const toHoraHrs = (hora) => (hora ? `${hora} HRS` : '—');

export const buildTextoNotificacionCita = ({
  analistaEmail,
  analistaNombre,
  destinatarioEmail,
  nombreCompleto,
  puestoNombre,
  fecha,
  hora,
  lugar
}) => {
  const fechaFormateada = toFechaLargaMayus(fecha);
  const horaFormateada = toHoraHrs(hora);

  return [
    'Agendar cita para la toma de datos biométricos',
    `De:\t${analistaEmail}`,
    `Para:\t${puestoNombre || 'Elemento'} ${nombreCompleto} <${destinatarioEmail}>`,
    'Asunto:\tCITA PROGRAMADA - Toma de Datos Biométricos',
    '🏛️',
    'GOBIERNO DEL ESTADO DE PUEBLA',
    'LA CAPITAL IMPARABLE',
    `Estimado(a) ${puestoNombre || 'Elemento'} ${nombreCompleto},`,
    `Por medio de la presente se le notifica que su cita ha sido programada para el día ${fechaFormateada} a las ${horaFormateada}. Le solicitamos presentarse en las instalaciones del Centro de Control de Confianza C5 con los siguientes documentos:`,
    'Identificación oficial vigente',
    'Comprobante de domicilio reciente',
    'Acuse de cita adjunto (impreso)',
    'Atentamente,',
    `${analistaNombre} — Analista`,
    lugar
  ].join('\n');
};

export const copyTextToClipboard = async (text) => {
  if (navigator?.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
};
