
function checkCrypto() {
  if (!window.crypto || !window.crypto.subtle) {
    throw new Error("Web Crypto API not available. Run on https or localhost and use a modern browser.");
  }
}

export function randBytes(len) {
  const b = new Uint8Array(len);
  crypto.getRandomValues(b);
  return b;
}

// Convert ArrayBuffer / TypedArray -> base64
export function bufToB64(bufLike) {
  // Accept ArrayBuffer or TypedArray
  let u8;
  if (bufLike instanceof ArrayBuffer) u8 = new Uint8Array(bufLike);
  else if (ArrayBuffer.isView(bufLike)) u8 = new Uint8Array(bufLike.buffer, bufLike.byteOffset, bufLike.byteLength);
  else throw new Error("bufToB64: expected ArrayBuffer or TypedArray");

  // Convert to binary string then btoa
  let binary = "";
  const chunkSize = 0x8000; // avoid stack issues for large buffers
  for (let i = 0; i < u8.length; i += chunkSize) {
    const slice = u8.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, slice);
  }
  return btoa(binary);
}

export function b64ToBuf(b64) {
  const binary = atob(b64);
  const len = binary.length;
  const u8 = new Uint8Array(len);
  for (let i = 0; i < len; i++) u8[i] = binary.charCodeAt(i);
  return u8;
}

export async function deriveKey(password, saltUint8) {
  checkCrypto();
  if (!password) throw new Error("deriveKey: missing password");
  if (!(saltUint8 instanceof Uint8Array)) throw new Error("deriveKey: salt must be Uint8Array");

  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltUint8,
      iterations: 120000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptString(plainText, password) {
  try {
    if (typeof plainText !== "string") throw new Error("encryptString: plainText must be string");
    if (!password) throw new Error("encryptString: password required");

    const enc = new TextEncoder();
    const salt = randBytes(16); // Uint8Array
    const iv = randBytes(12);   // AES-GCM 96-bit iv

    const key = await deriveKey(password, salt);
    const cipherBuf = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      key,
      enc.encode(plainText)
    );

    return {
      salt: bufToB64(salt),
      iv: bufToB64(iv),
      ciphertext: bufToB64(cipherBuf), // cipherBuf is ArrayBuffer
    };
  } catch (err) {
    console.error("encryptString error:", err);
    throw err;
  }
}

export async function decryptString(payload, password) {
  try {
    if (!payload || !payload.salt || !payload.iv || !payload.ciphertext) {
      throw new Error("decryptString: invalid payload");
    }
    const salt = b64ToBuf(payload.salt); // Uint8Array
    const iv = b64ToBuf(payload.iv);
    const cipherBytes = b64ToBuf(payload.ciphertext);

    const key = await deriveKey(password, salt);
    const plainBuf = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      key,
      cipherBytes
    );

    return new TextDecoder().decode(plainBuf);
  } catch (err) {
    console.error("decryptString error:", err);
    throw err;
  }
}

export async function encryptBytes(bytesOrArrayBuffer, password) {
  try {
    if (!password) throw new Error("encryptBytes: password required");

    let bytes;
    if (bytesOrArrayBuffer instanceof ArrayBuffer) bytes = new Uint8Array(bytesOrArrayBuffer);
    else if (ArrayBuffer.isView(bytesOrArrayBuffer)) bytes = new Uint8Array(bytesOrArrayBuffer.buffer, bytesOrArrayBuffer.byteOffset, bytesOrArrayBuffer.byteLength);
    else throw new Error("encryptBytes: expected ArrayBuffer or TypedArray");

    const salt = randBytes(16);
    const iv = randBytes(12);
    const key = await deriveKey(password, salt);
    const cipherBuf = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, bytes);

    return {
      salt: bufToB64(salt),
      iv: bufToB64(iv),
      ciphertext: bufToB64(cipherBuf),
    };
  } catch (err) {
    console.error("encryptBytes error:", err);
    throw err;
  }
}

export async function decryptBytes(payload, password) {
  try {
    if (!payload || !payload.salt || !payload.iv || !payload.ciphertext) {
      throw new Error("decryptBytes: invalid payload");
    }
    const salt = b64ToBuf(payload.salt);
    const iv = b64ToBuf(payload.iv);
    const cipherBytes = b64ToBuf(payload.ciphertext);

    const key = await deriveKey(password, salt);
    const plainBuf = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, cipherBytes);

    return new Uint8Array(plainBuf);
  } catch (err) {
    console.error("decryptBytes error:", err);
    throw err;
  }
}
