/**
 * Genera el HTML del oficio de rechazo con membrete listo para imprimir/descargar
 */
export function generarHTMLOficio(data) {
  const { oficio, persona, rechazo, contexto } = data;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Oficio de No Procedencia - ${persona.nombre_completo}</title>
  <style>
    @page {
      size: letter;
      margin: 0;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      color: #1a1a1a;
      background: white;
      width: 216mm;
      min-height: 279mm;
      margin: 0 auto;
    }
    .page {
      width: 100%;
      min-height: 279mm;
      padding: 15mm 25mm 20mm 25mm;
      position: relative;
    }

    /* ===== MEMBRETE SUPERIOR ===== */
    .membrete-superior {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 3px solid #6c1d45;
      padding-bottom: 12px;
      margin-bottom: 30px;
    }
    .membrete-logo-izq,
    .membrete-logo-der {
      width: 80px;
      height: 80px;
      border: 1px dashed #ccc;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 8pt;
      color: #999;
      text-align: center;
    }
    .membrete-centro {
      text-align: center;
      flex: 1;
      padding: 0 20px;
    }
    .membrete-centro h1 {
      font-size: 14pt;
      color: #6c1d45;
      letter-spacing: 2px;
      margin-bottom: 4px;
    }
    .membrete-centro h2 {
      font-size: 11pt;
      color: #333;
      font-weight: normal;
      margin-bottom: 2px;
    }
    .membrete-centro p {
      font-size: 9pt;
      color: #666;
    }

    /* ===== CONTENIDO ===== */
    .oficio-meta {
      text-align: right;
      margin-bottom: 20px;
      font-size: 11pt;
    }
    .oficio-meta p {
      margin-bottom: 3px;
    }
    .oficio-meta .numero {
      font-weight: bold;
      color: #6c1d45;
    }

    .oficio-titulo {
      text-align: center;
      font-size: 14pt;
      font-weight: bold;
      color: #6c1d45;
      text-transform: uppercase;
      letter-spacing: 3px;
      margin: 25px 0;
      padding: 10px 0;
      border-top: 1px solid #ddd;
      border-bottom: 1px solid #ddd;
    }

    .oficio-body {
      line-height: 1.8;
      text-align: justify;
      margin-bottom: 25px;
    }
    .oficio-body p {
      margin-bottom: 15px;
      text-indent: 40px;
    }
    .oficio-body p.sin-indent {
      text-indent: 0;
    }

    .datos-tabla {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 11pt;
    }
    .datos-tabla td {
      padding: 6px 12px;
      vertical-align: top;
    }
    .datos-tabla td:first-child {
      font-weight: bold;
      color: #555;
      width: 200px;
      white-space: nowrap;
    }
    .datos-tabla tr {
      border-bottom: 1px solid #eee;
    }

    .motivo-box {
      background-color: #fdf2f2;
      border-left: 4px solid #c0392b;
      padding: 15px 20px;
      margin: 20px 0;
      font-style: italic;
    }
    .motivo-box .label {
      font-weight: bold;
      font-style: normal;
      color: #c0392b;
      margin-bottom: 5px;
      font-size: 10pt;
      text-transform: uppercase;
    }

    /* ===== FIRMAS ===== */
    .firmas-container {
      display: flex;
      justify-content: space-between;
      margin-top: 60px;
      padding-top: 10px;
    }
    .firma {
      text-align: center;
      width: 45%;
    }
    .firma-linea {
      border-top: 1px solid #333;
      margin-bottom: 5px;
      margin-top: 50px;
    }
    .firma-nombre {
      font-weight: bold;
      font-size: 11pt;
    }
    .firma-cargo {
      font-size: 9pt;
      color: #666;
    }

    /* ===== MEMBRETE INFERIOR ===== */
    .membrete-inferior {
      position: absolute;
      bottom: 15mm;
      left: 25mm;
      right: 25mm;
      border-top: 2px solid #6c1d45;
      padding-top: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 8pt;
      color: #888;
    }
    .membrete-inferior span {
      display: block;
    }

    @media print {
      body { margin: 0; }
      .page { padding: 15mm 25mm 20mm 25mm; }
      .membrete-logo-izq, .membrete-logo-der {
        border: none;
      }
    }
  </style>
</head>
<body>
  <div class="page">

    <!-- MEMBRETE SUPERIOR -->
    <div class="membrete-superior">
      <div class="membrete-logo-izq">
        <!-- LOGO IZQ -->
        Logo
      </div>
      <div class="membrete-centro">
        <h1>GOBIERNO DEL ESTADO DE PUEBLA</h1>
        <h2>Registro de Personal de Seguridad Publica (RPSP)</h2>
        <p>Sistema Institucional de Registro de Personal de Seguridad Publica</p>
      </div>
      <div class="membrete-logo-der">
        <!-- LOGO DER -->
        Logo
      </div>
    </div>

    <!-- META DEL OFICIO -->
    <div class="oficio-meta">
      <p class="numero">No. Solicitud: ${oficio.numero_solicitud}</p>
      ${oficio.numero_oficio_c3 ? `<p>Oficio C3: ${String(oficio.numero_oficio_c3).toUpperCase()}</p>` : ''}
      <p>Puebla de Zaragoza, a ${oficio.fecha_emision}</p>
    </div>

    <!-- TÍTULO -->
    <div class="oficio-titulo">Oficio de No Procedencia</div>

    <!-- CUERPO -->
    <div class="oficio-body">
      <p>
        Por medio del presente, se hace constar que derivado del análisis y evaluación 
        realizada al trámite de alta con número de solicitud <strong>${oficio.numero_solicitud}</strong>, 
        se ha determinado que la persona abajo referida <strong>NO PROCEDE</strong> para ser 
        dada de alta en el puesto solicitado.
      </p>

      <!-- DATOS DE LA PERSONA -->
      <table class="datos-tabla">
        <tr>
          <td>Nombre completo:</td>
          <td><strong>${persona.nombre_completo}</strong></td>
        </tr>
        <tr>
          <td>Puesto solicitado:</td>
          <td>${persona.puesto_solicitado}</td>
        </tr>
        <tr>
          <td>Fecha de nacimiento:</td>
          <td>${persona.fecha_nacimiento}</td>
        </tr>
        <tr>
          <td>Municipio:</td>
          <td>${contexto.municipio}</td>
        </tr>
        <tr>
          <td>Región:</td>
          <td>${contexto.region}</td>
        </tr>
        ${contexto.es_dependencia ? `<tr><td>Dependencia:</td><td>${contexto.dependencia}</td></tr>` : ''}
        <tr>
          <td>Etapa de rechazo:</td>
          <td>${rechazo.etapa}</td>
        </tr>
        <tr>
          <td>Fecha de rechazo:</td>
          <td>${rechazo.fecha}</td>
        </tr>
      </table>

      <!-- MOTIVO -->
      <div class="motivo-box">
        <div class="label">Motivo de No Procedencia</div>
        ${rechazo.motivo}
      </div>

      <p>
        Lo anterior, con fundamento en las disposiciones aplicables en materia de 
        control de confianza y evaluación de personal de seguridad pública del Estado de Puebla.
      </p>

      <p class="sin-indent">
        Se extiende el presente para los fines legales y administrativos que correspondan.
      </p>
    </div>

    <!-- FIRMAS -->
    <div class="firmas-container">
      <div class="firma">
        <div class="firma-linea"></div>
        <div class="firma-nombre">${contexto.analista}</div>
        <div class="firma-cargo">Analista C5 Responsable</div>
      </div>
      <div class="firma">
        <div class="firma-linea"></div>
        <div class="firma-nombre">${contexto.validador_c3}</div>
        <div class="firma-cargo">Validador C3</div>
      </div>
    </div>

    <!-- MEMBRETE INFERIOR -->
    <div class="membrete-inferior">
      <span>RPSP - Registro de Personal de Seguridad Publica</span>
      <span>Documento generado el ${oficio.fecha_emision}</span>
      <span>Gobierno del Estado de Puebla</span>
    </div>

  </div>
</body>
</html>`;
}
