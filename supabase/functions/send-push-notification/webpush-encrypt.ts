// Web Push encryption implementation for Deno
// Based on RFC 8291 (Message Encryption for Web Push)

export function base64UrlToUint8Array(base64String: string): Uint8Array {
  // Remove any whitespace (newlines, spaces, etc)
  const cleaned = base64String.replace(/\s/g, '')
  const padding = '='.repeat((4 - (cleaned.length % 4)) % 4)
  const base64 = (cleaned + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function uint8ArrayToBase64Url(array: Uint8Array): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  let result = ''
  let i = 0
  
  while (i < array.length) {
    const a = array[i++]
    const b = i < array.length ? array[i++] : 0
    const c = i < array.length ? array[i++] : 0
    
    const bitmap = (a << 16) | (b << 8) | c
    
    result += chars[(bitmap >> 18) & 63]
    result += chars[(bitmap >> 12) & 63]
    result += i - 2 < array.length ? chars[(bitmap >> 6) & 63] : '='
    result += i - 1 < array.length ? chars[bitmap & 63] : '='
  }
  
  return result.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  // Extract
  const key = await crypto.subtle.importKey('raw', salt, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const prk = new Uint8Array(await crypto.subtle.sign('HMAC', key, ikm))
  
  // Expand
  const key2 = await crypto.subtle.importKey('raw', prk, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  
  const iterations = Math.ceil(length / 32)
  let output = new Uint8Array(0)
  let t = new Uint8Array(0)
  
  for (let i = 1; i <= iterations; i++) {
    const input = new Uint8Array(t.length + info.length + 1)
    input.set(t, 0)
    input.set(info, t.length)
    input[t.length + info.length] = i
    
    t = new Uint8Array(await crypto.subtle.sign('HMAC', key2, input))
    
    const newOutput = new Uint8Array(output.length + t.length)
    newOutput.set(output, 0)
    newOutput.set(t, output.length)
    output = newOutput
  }
  
  return output.slice(0, length)
}

export async function encrypt(
  userPublicKey: string,
  userAuthSecret: string,
  payload: string
): Promise<{ ciphertext: Uint8Array; salt: Uint8Array; serverPublicKey: Uint8Array }> {
  
  // Generate server key pair
  const serverKeyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits']
  )
  
  // Import user's public key
  const userPublicKeyBytes = base64UrlToUint8Array(userPublicKey)
  const userKey = await crypto.subtle.importKey(
    'raw',
    userPublicKeyBytes,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  )
  
  // ECDH
  const sharedSecret = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: 'ECDH', public: userKey },
      serverKeyPair.privateKey,
      256
    )
  )
  
  // Export server public key
  const serverPublicKeyRaw = new Uint8Array(
    await crypto.subtle.exportKey('raw', serverKeyPair.publicKey)
  )
  
  // Auth secret
  const authSecret = base64UrlToUint8Array(userAuthSecret)
  
  // Generate salt
  const salt = crypto.getRandomValues(new Uint8Array(16))
  
  // Key derivation
  const authInfo = new TextEncoder().encode('Content-Encoding: auth\x00')
  const prk = await hkdf(authSecret, sharedSecret, authInfo, 32)
  
  // Create context (client public key + server public key)
  const keyLabel = new TextEncoder().encode('P-256')
  const context = new Uint8Array(1 + 2 + 65 + 2 + 65) // label length + user key length indicator + user key + server key length indicator + server key
  let offset = 0
  
  // Label length
  context[offset++] = 0
  
  // Client (user) public key length (65 bytes uncompressed)
  context[offset++] = 0
  context[offset++] = 65
  context.set(userPublicKeyBytes, offset)
  offset += 65
  
  // Server public key length (65 bytes uncompressed)
  context[offset++] = 0
  context[offset++] = 65
  context.set(serverPublicKeyRaw, offset)
  
  // Derive content encryption key
  const cekInfo = new TextEncoder().encode('Content-Encoding: aesgcm\x00')
  const cekInfoWithContext = new Uint8Array(cekInfo.length + context.length)
  cekInfoWithContext.set(cekInfo, 0)
  cekInfoWithContext.set(context, cekInfo.length)
  const contentEncryptionKey = await hkdf(salt, prk, cekInfoWithContext, 16)
  
  // Derive nonce
  const nonceInfo = new TextEncoder().encode('Content-Encoding: nonce\x00')
  const nonceInfoWithContext = new Uint8Array(nonceInfo.length + context.length)
  nonceInfoWithContext.set(nonceInfo, 0)
  nonceInfoWithContext.set(context, nonceInfo.length)
  const nonce = await hkdf(salt, prk, nonceInfoWithContext, 12)
  
  // Prepare payload with padding
  const payloadBytes = new TextEncoder().encode(payload)
  const paddedPayload = new Uint8Array(2 + payloadBytes.length)
  paddedPayload[0] = 0
  paddedPayload[1] = 0
  paddedPayload.set(payloadBytes, 2)
  
  // Encrypt
  const key = await crypto.subtle.importKey('raw', contentEncryptionKey, 'AES-GCM', false, ['encrypt'])
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, key, paddedPayload)
  )
  
  return {
    ciphertext,
    salt,
    serverPublicKey: serverPublicKeyRaw
  }
}
