/**
 * Admin.js - Panel Administrador para procesar y cifrar listas de alumnos
 * Lee CSV/Excel (Código, Grupo, Turno) y genera `alumnos_cifrados.json`
 */

document.addEventListener('DOMContentLoaded', () => {
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
});
