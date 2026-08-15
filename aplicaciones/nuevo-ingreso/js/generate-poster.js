const fs = require('fs');
const path = require('path');

const jsCode = fs.readFileSync(path.join(__dirname, 'qrcode.js'), 'utf8');

// Execute qrcode module in Node context
const vm = require('vm');
const elementsCreated = [];
const sandbox = {
  window: {},
  document: {
    createElementNS: (ns, tag) => {
      const elem = {
        tag,
        attrs: {},
        children: [],
        setAttribute(k, v) { this.attrs[k] = v; },
        appendChild(c) { this.children.push(c); }
      };
      elementsCreated.push(elem);
      return elem;
    }
  }
};
vm.createContext(sandbox);
vm.runInContext(jsCode, sandbox);

const container = sandbox.document.createElementNS('http://www.w3.org/2000/svg', 'div');
const portalUrl = 'https://escuela.edu.mx/aplicaciones/nuevo-ingreso/';

new sandbox.window.LightQRCode(container, {
  text: portalUrl,
  width: 500,
  height: 500,
  colorDark: '#0f172a',
  colorLight: '#ffffff'
});

const svgNode = container.children[0];

function elementToSvg(el) {
  if (!el || !el.tag) return '';
  const attrs = Object.entries(el.attrs || {}).map(([k, v]) => `${k}="${v}"`).join(' ');
  const inner = (el.children || []).map(c => elementToSvg(c)).join('');
  if (inner) {
    return `<${el.tag} xmlns="http://www.w3.org/2000/svg" ${attrs}>${inner}</${el.tag}>`;
  }
  return `<${el.tag} ${attrs}/>`;
}

const svgString = elementToSvg(svgNode);
fs.writeFileSync(path.join(__dirname, '../qr_portal_escuela.svg'), svgString);

const posterHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Cartel de Consulta de Nuevo Ingreso - QR Oficial</title>
  <style>
    body { font-family: 'Segoe UI', system-ui, sans-serif; text-align: center; padding: 3rem 1rem; background: #f8fafc; color: #0f172a; }
    .poster-card { max-width: 600px; margin: 0 auto; background: white; padding: 3.5rem 2rem; border-radius: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.08); border: 2px solid #e2e8f0; }
    .badge { display: inline-block; background: #eff6ff; color: #1d4ed8; font-weight: 700; text-transform: uppercase; font-size: 0.85rem; padding: 0.4rem 1rem; border-radius: 99px; border: 1px solid #bfdbfe; margin-bottom: 1rem; }
    h1 { font-size: 2.2rem; color: #0f172a; margin-bottom: 0.5rem; }
    p { font-size: 1.2rem; color: #475569; margin-bottom: 2rem; line-height: 1.5; }
    .qr-container { background: #ffffff; padding: 1.5rem; display: inline-block; border-radius: 20px; border: 2px dashed #cbd5e1; margin-bottom: 2rem; }
    .url-badge { font-family: monospace; font-size: 1.2rem; font-weight: bold; background: #0f172a; color: #ffffff; padding: 0.9rem 1.8rem; border-radius: 99px; display: inline-block; }
    @media print {
      body { background: white; padding: 0; }
      .poster-card { box-shadow: none; border: none; }
    }
  </style>
</head>
<body>
  <div class="poster-card">
    <div class="badge">Aviso Importante a los Aspirantes</div>
    <h1>Consulta de Resultados de Primer Ingreso</h1>
    <p>Escanea este código QR con la cámara de tu celular para ingresar al portal oficial y conocer tu <strong>Grupo</strong> y <strong>Turno</strong> asignados.</p>
    <div class="qr-container">
      ${svgString}
    </div>
    <div>
      <div class="url-badge">escuela.edu.mx/aplicaciones/nuevo-ingreso/</div>
    </div>
  </div>
</body>
</html>`;

fs.writeFileSync(path.join(__dirname, '../cartel_qr_escuela.html'), posterHtml);
console.log('Archivos qr_portal_escuela.svg y cartel_qr_escuela.html creados con éxito.');
