/**
 * CryptoEngine - Motor de cifrado seguro para el navegador usando Web Crypto API
 * Algoritmo: SHA-256 para indexación + AES-256-GCM para cifrado de payload.
 */

const CryptoEngine = {
  /**
   * Normaliza el código (elimina espacios, guiones y convierte a mayúsculas)
   */
  cleanCode(code) {
    if (!code) return '';
    return String(code).trim().replace(/[\s-]/g, '').toUpperCase();
  },

  /**
   * Genera el Hash SHA-256 del código (para buscar en la base de datos sin exponer el código)
   */
  async hashCode(code) {
    const cleaned = this.cleanCode(code);
    if (!cleaned) return '';
    const encoder = new TextEncoder();
    const data = encoder.encode(cleaned);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  },

  /**
   * Deriva una clave de cifrado AES-GCM a partir del código del alumno
   */
  async deriveKey(code) {
    const cleaned = this.cleanCode(code);
    const encoder = new TextEncoder();
    // Usamos SHA-256 del código como material de clave de 256 bits
    const keyMaterial = await crypto.subtle.digest('SHA-256', encoder.encode(cleaned + '_KEY_SALT_2026'));
    return crypto.subtle.importKey(
      'raw',
      keyMaterial,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    );
  },

  /**
   * Cifra un objeto de datos (ej: { grupo: "1º A", turno: "Matutino" })
   */
  async encryptData(code, dataObj) {
    try {
      const key = await this.deriveKey(code);
      const encoder = new TextEncoder();
      const encodedPayload = encoder.encode(JSON.stringify(dataObj));
      
      // Vector de inicialización (IV) de 12 bytes aleatorios para AES-GCM
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      const encryptedBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        encodedPayload
      );

      return {
        iv: this.arrayBufferToBase64(iv),
        data: this.arrayBufferToBase64(encryptedBuffer)
      };
    } catch (e) {
      console.error('Error al cifrar datos:', e);
      throw e;
    }
  },

  /**
   * Descifra un objeto cifrado utilizando el código del alumno
   */
  async decryptData(code, encryptedObj) {
    try {
      if (!encryptedObj || !encryptedObj.iv || !encryptedObj.data) return null;
      
      const key = await this.deriveKey(code);
      const iv = this.base64ToArrayBuffer(encryptedObj.iv);
      const cipherText = this.base64ToArrayBuffer(encryptedObj.data);

      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: new Uint8Array(iv) },
        key,
        cipherText
      );

      const decoder = new TextDecoder();
      const decodedString = decoder.decode(decryptedBuffer);
      return JSON.parse(decodedString);
    } catch (e) {
      // Si la clave o el IV son incorrectos, fallará el descifrado
      return null;
    }
  },

  // Utilidades Base64
  arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  },

  base64ToArrayBuffer(base64) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }
};
