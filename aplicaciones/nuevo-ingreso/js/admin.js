/**
 * Admin.js - Panel Administrador para procesar y cifrar listas de alumnos
 * Lee CSV/Excel (Código, Grupo, Turno) y genera `alumnos_cifrados.json`
 */

document.addEventListener('DOMContentLoaded', () => {
  // 0. Autenticación por PIN de Administrador
  // Hash SHA-256 del PIN autorizado "q1234q"
  const ADMIN_PIN_HASH = '96b7d30c733a0667791d2a77dc5645bd15782fc49e223bec4ac427f6c876b8c4';

  const pinLockScreen = document.getElementById('pinLockScreen');
  const adminMainContent = document.getElementById('adminMainContent');
  const pinForm = document.getElementById('pinForm');
  const pinInput = document.getElementById('pinInput');
  const pinStatus = document.getElementById('pinStatus');
  const pinStatusText = document.getElementById('pinStatusText');
  const lockAdminBtn = document.getElementById('lockAdminBtn');

  async function hashPin(pin) {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin.trim());
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function checkSession() {
    if (sessionStorage.getItem('admin_authenticated') === 'true') {
      if (pinLockScreen) pinLockScreen.style.display = 'none';
      if (adminMainContent) adminMainContent.style.display = 'block';
      updatePortalQr();
    } else {
      if (pinLockScreen) pinLockScreen.style.display = 'block';
      if (adminMainContent) adminMainContent.style.display = 'none';
      if (pinInput) setTimeout(() => pinInput.focus(), 100);
    }
  }

  if (pinForm) {
    pinForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const enteredPin = pinInput.value;
      if (!enteredPin) return;

      const enteredHash = await hashPin(enteredPin);
      if (enteredHash === ADMIN_PIN_HASH) {
        sessionStorage.setItem('admin_authenticated', 'true');
        pinStatus.style.display = 'none';
        pinInput.value = '';
        checkSession();
      } else {
        pinStatusText.textContent = '❌ PIN incorrecto. Acceso denegado.';
        pinStatus.style.display = 'flex';
        pinInput.value = '';
        pinInput.focus();

        // Efecto de vibración / shake
        if (pinLockScreen) {
          pinLockScreen.classList.add('shake-anim');
          setTimeout(() => pinLockScreen.classList.remove('shake-anim'), 500);
        }
      }
    });
  }

  if (lockAdminBtn) {
    lockAdminBtn.addEventListener('click', () => {
      sessionStorage.removeItem('admin_authenticated');
      checkSession();
    });
  }

  checkSession();

  const rawDataInput = document.getElementById('rawDataInput');
  const processBtn = document.getElementById('processBtn');
  const demoDataBtn = document.getElementById('demoDataBtn');
  const exportBtn = document.getElementById('exportBtn');

  const previewSection = document.getElementById('previewSection');
  const recordCountBadge = document.getElementById('recordCountBadge');
  const previewTableBody = document.getElementById('previewTableBody');

  const adminStatus = document.getElementById('adminStatus');
  const adminStatusText = document.getElementById('adminStatusText');
  const adminProgress = document.getElementById('adminProgress');

  let parsedRecords = [];
  let encryptedDatabase = null;

  // 1. Cargar datos de demostración
  demoDataBtn.addEventListener('click', () => {
    rawDataInput.value = `Código\tGrupo\tTurno
22400001\t1º A\tMatutino
22400002\t1º B\tVespertino
22400003\t1º C\tMatutino
ADM202601\t1º A\tVespertino
ADM202602\t1º B\tMatutino
ADM202603\t1º C\tVespertino`;
    parseInputData();
  });

  // 2. Escuchar cambios en la caja de texto
  rawDataInput.addEventListener('input', () => {
    parseInputData();
  });

  // 3. Parser Inteligente de Texto / Excel / CSV
  function parseInputData() {
    const text = rawDataInput.value.trim();
    parsedRecords = [];
    encryptedDatabase = null;
    exportBtn.disabled = true;

    if (!text) {
      previewSection.style.display = 'none';
      return;
    }

    const lines = text.split(/\r?\n/);
    let count = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Omitir encabezados comunes si existen
      if (i === 0 && (line.toLowerCase().includes('código') || line.toLowerCase().includes('codigo'))) {
        continue;
      }

      // Separación inteligente por Tabulación (\t), Coma (,), Punto y coma (;) o Espacio múltiple
      let parts = line.split('\t');
      if (parts.length < 3) parts = line.split(',');
      if (parts.length < 3) parts = line.split(';');
      if (parts.length < 3) parts = line.split(/\s{2,}/);

      if (parts.length >= 3) {
        const code = CryptoEngine.cleanCode(parts[0]);
        const grupo = parts[1].trim();
        const turno = parts[2].trim();

        if (code && grupo && turno) {
          parsedRecords.push({ code, grupo, turno });
          count++;
        }
      }
    }

    renderPreview(parsedRecords);
  }

  // 4. Renderizar vista previa en tabla
  function renderPreview(records) {
    previewTableBody.innerHTML = '';
    recordCountBadge.textContent = `${records.length} Alumnos Detectados`;

    if (records.length === 0) {
      previewSection.style.display = 'none';
      return;
    }

    // Mostrar máximo 10 filas en vista previa
    const previewSubset = records.slice(0, 10);
    previewSubset.forEach(r => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><code>${r.code}</code></td>
        <td><strong>${r.grupo}</strong></td>
        <td>${r.turno}</td>
      `;
      previewTableBody.appendChild(tr);
    });

    if (records.length > 10) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="3" style="text-align: center; color: #64748b; font-style: italic;">... y ${records.length - 10} registros más.</td>`;
      previewTableBody.appendChild(tr);
    }

    previewSection.style.display = 'block';
  }

  // 5. Cifrar Base de Datos en Lote
  processBtn.addEventListener('click', async () => {
    if (parsedRecords.length === 0) {
      showAdminStatus('Por favor ingresa o carga datos válidos primero.', 'error');
      return;
    }

    showAdminStatus('Cifrando registros con SHA-256 + AES-GCM-256...', 'info');
    processBtn.disabled = true;
    exportBtn.disabled = true;

    encryptedDatabase = {};
    const total = parsedRecords.length;

    for (let i = 0; i < total; i++) {
      const item = parsedRecords[i];
      const codeHash = await CryptoEngine.hashCode(item.code);
      const encryptedPayload = await CryptoEngine.encryptData(item.code, {
        grupo: item.grupo,
        turno: item.turno
      });

      encryptedDatabase[codeHash] = encryptedPayload;

      // Actualizar progreso
      const percent = Math.round(((i + 1) / total) * 100);
      adminProgress.style.width = percent + '%';
    }

    showAdminStatus(`✅ Cifrado completado con éxito. Se generaron ${total} registros indescifrables. Haz clic en "Descargar Base de Datos Cifrada".`, 'success');
    processBtn.disabled = false;
    exportBtn.disabled = false;
  });

  // 6. Exportar y Descargar archivo JSON
  exportBtn.addEventListener('click', () => {
    if (!encryptedDatabase) return;

    const jsonString = JSON.stringify(encryptedDatabase, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'alumnos_cifrados.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  function showAdminStatus(text, type) {
    adminStatusText.textContent = text;
    adminStatus.className = `status-msg active status-${type === 'error' ? 'error' : 'info'}`;
  }

  // 7. Generación de QR de Difusión para la Escuela
  const portalUrlInput = document.getElementById('portalUrlInput');
  const portalQrPreview = document.getElementById('portalQrPreview');
  const printPosterBtn = document.getElementById('printPosterBtn');

  function updatePortalQr() {
    if (!portalUrlInput || !portalQrPreview) return;
    const url = portalUrlInput.value.trim() || 'https://www.prepachapala.edu.mx/aplicaciones/nuevo-ingreso/';
    if (window.LightQRCode) {
      new LightQRCode(portalQrPreview, {
        text: url,
        width: 160,
        height: 160,
        colorDark: '#0f172a',
        colorLight: '#ffffff'
      });
    }
  }

  if (portalUrlInput) {
    portalUrlInput.addEventListener('input', updatePortalQr);
    // Ejecutar inmediatamente y al cargar todo
    updatePortalQr();
    setTimeout(updatePortalQr, 300);
  }

  if (printPosterBtn) {
    printPosterBtn.addEventListener('click', () => {
      updatePortalQr();
      const url = portalUrlInput.value.trim() || 'https://www.prepachapala.edu.mx/aplicaciones/nuevo-ingreso/';
      const svgHtml = portalQrPreview.innerHTML;

      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <title>Cartel Oficial - Consulta de Resultados de Primer Ingreso</title>
          <style>
            body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; text-align: center; padding: 3rem 1rem; background: #ffffff; color: #0f172a; }
            .poster-card { max-width: 620px; margin: 0 auto; background: white; padding: 3.5rem 2.5rem; border-radius: 24px; border: 3px solid #0f172a; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
            .badge { display: inline-block; background: #0f172a; color: #ffffff; font-weight: 800; text-transform: uppercase; font-size: 0.85rem; padding: 0.5rem 1.4rem; border-radius: 99px; margin-bottom: 1.5rem; letter-spacing: 0.08em; }
            h1 { font-size: 2.4rem; color: #0f172a; margin-bottom: 0.75rem; font-weight: 800; line-height: 1.2; }
            p { font-size: 1.25rem; color: #334155; margin-bottom: 2rem; line-height: 1.5; }
            .qr-container { background: #ffffff; padding: 1.5rem; display: inline-block; border-radius: 20px; border: 2px dashed #94a3b8; margin-bottom: 2rem; line-height: 0; }
            .qr-container svg { width: 220px; height: 220px; }
            .url-badge { font-family: monospace; font-size: 1.15rem; font-weight: bold; background: #f1f5f9; color: #0f172a; padding: 0.9rem 1.8rem; border-radius: 99px; display: inline-block; border: 1px solid #cbd5e1; word-break: break-all; }
            @media print {
              body { padding: 0; background: white; }
              .poster-card { border: 3px solid #000; box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="poster-card">
            <div class="badge">Aviso Oficial a la Comunidad Escolar</div>
            <h1>Resultados de Primer Ingreso</h1>
            <p>Escanea este código QR con la cámara de tu celular para consultar tu <strong>Grupo</strong> y <strong>Turno</strong> asignados.</p>
            <div class="qr-container">
              ${svgHtml}
            </div>
            <div>
              <div class="url-badge">${url}</div>
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    });
  }
});


