/**
 * App.js - Lógica del Portal de Consulta para Alumnos de Primer Ingreso
 */

document.addEventListener('DOMContentLoaded', () => {
  let dbData = null;

  // Elementos del DOM
  const searchForm = document.getElementById('searchForm');
  const codeInput = document.getElementById('codeInput');
  const searchBtn = document.getElementById('searchBtn');
  const btnSpinner = document.getElementById('btnSpinner');
  const btnText = document.getElementById('btnText');
  const statusMsg = document.getElementById('statusMsg');
  const statusMsgText = document.getElementById('statusMsgText');
  
  const resultContainer = document.getElementById('resultContainer');
  const displayCode = document.getElementById('displayCode');
  const displayGroup = document.getElementById('displayGroup');
  const displayShift = document.getElementById('displayShift');
  const qrContainer = document.getElementById('qrContainer');
  
  const printBtn = document.getElementById('printBtn');
  const newSearchBtn = document.getElementById('newSearchBtn');

  // 1. Cargar la base de datos cifrada (alumnos_cifrados.json)
  async function loadDatabase() {
    try {
      showStatus('Cargando padrón de resultados...', 'info');
      const response = await fetch('alumnos_cifrados.json?v=' + Date.now());
      if (!response.ok) {
        throw new Error('No se pudo cargar la base de datos de resultados.');
      }
      dbData = await response.json();
      hideStatus();
      
      // Comprobar si hay un código en la URL (ej: ?codigo=22400001)
      const urlParams = new URLSearchParams(window.location.search);
      const codeFromUrl = urlParams.get('codigo') || urlParams.get('c');
      if (codeFromUrl) {
        codeInput.value = codeFromUrl;
        performSearch(codeFromUrl);
      }
    } catch (error) {
      console.error(error);
      showStatus('Atención: La lista de resultados aún no ha sido cargada por la escuela o no está disponible.', 'error');
    }
  }

  // 2. Ejecutar Búsqueda y Descifrado
  async function performSearch(code) {
    const cleanedCode = CryptoEngine.cleanCode(code);
    if (!cleanedCode) {
      showStatus('Por favor ingresa un código válido.', 'error');
      codeInput.focus();
      return;
    }

    if (!dbData) {
      showStatus('La base de datos de resultados no está lista. Intenta nuevamente.', 'error');
      return;
    }

    setLoading(true);
    hideStatus();
    hideResult();

    try {
      // a. Obtener Hash SHA-256 del código ingresado
      const codeHash = await CryptoEngine.hashCode(cleanedCode);

      // b. Buscar en la base de datos cifrada
      const encryptedRecord = dbData[codeHash];

      if (!encryptedRecord) {
        setLoading(false);
        showStatus(`No se encontró asignación para el código "${cleanedCode}". Verifica que el código ingresado sea el correcto.`, 'error');
        return;
      }

      // c. Descifrar la información usando el propio código
      const studentInfo = await CryptoEngine.decryptData(cleanedCode, encryptedRecord);

      if (!studentInfo || !studentInfo.grupo || !studentInfo.turno) {
        setLoading(false);
        showStatus('Error al procesar la información del alumno.', 'error');
        return;
      }

      // d. Mostrar resultados exitosos
      renderResults(cleanedCode, studentInfo);
      setLoading(false);

    } catch (err) {
      console.error(err);
      setLoading(false);
      showStatus('Ocurrió un error inesperado al procesar la consulta.', 'error');
    }
  }

  // 3. Renderizar tarjeta de asignación
  function renderResults(code, info) {
    displayCode.textContent = code;
    displayGroup.textContent = info.grupo;
    displayShift.textContent = info.turno;

    // Generar enlace directo para QR de verificación
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('codigo', code);
    
    // Renderizar QR (opcional para comprobante)
    if (window.LightQRCode && qrContainer) {
      new LightQRCode(qrContainer, {
        text: currentUrl.toString(),
        width: 90,
        height: 90,
        colorDark: '#0f172a',
        colorLight: '#ffffff'
      });
    }

    resultContainer.classList.add('active');
    resultContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Funciones de UI
  function showStatus(text, type) {
    statusMsgText.textContent = text;
    statusMsg.className = `status-msg active status-${type}`;
  }

  function hideStatus() {
    statusMsg.className = 'status-msg';
  }

  function hideResult() {
    resultContainer.classList.remove('active');
  }

  function setLoading(isLoading) {
    if (isLoading) {
      searchBtn.disabled = true;
      btnSpinner.style.display = 'inline-block';
      btnText.textContent = 'Buscando...';
    } else {
      searchBtn.disabled = false;
      btnSpinner.style.display = 'none';
      btnText.textContent = 'Consultar Resultado';
    }
  }

  // Event Listeners
  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    performSearch(codeInput.value);
  });

  printBtn.addEventListener('click', () => {
    window.print();
  });

  newSearchBtn.addEventListener('click', () => {
    hideResult();
    hideStatus();
    codeInput.value = '';
    codeInput.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Inicializar
  loadDatabase();
});
