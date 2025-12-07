// VAPID JWT generation for Web Push
// Simplified approach using only Web Crypto API

import { base64UrlToUint8Array, uint8ArrayToBase64Url } from './webpush-encrypt.ts'

export async function generateVapidAuthToken(
  audience: string,
  subject: string,
  privateKeyBase64: string,
  publicKeyBase64: string
): Promise<string> {
  console.log('🔐 Generating VAPID JWT...');
  console.log('   Audience:', audience);
  console.log('   Subject:', subject);
  
  const header = {
    typ: 'JWT',
    alg: 'ES256'
  }

  const now = Math.floor(Date.now() / 1000)
  const payload = {
    aud: audience,
    exp: now + 43200, // 12 hours
    sub: subject
  }

  const encoder = new TextEncoder()
  const headerB64 = uint8ArrayToBase64Url(encoder.encode(JSON.stringify(header)))
  const payloadB64 = uint8ArrayToBase64Url(encoder.encode(JSON.stringify(payload)))
  const unsignedToken = `${headerB64}.${payloadB64}`

  // Decode keys
  const publicKeyBytes = base64UrlToUint8Array(publicKeyBase64)
  const privateKeyBytes = base64UrlToUint8Array(privateKeyBase64)
  
  console.log('   Public key length:', publicKeyBytes.length, 'bytes');
  console.log('   Private key length:', privateKeyBytes.length, 'bytes');
  
  // Validate key formats
  if (publicKeyBytes[0] !== 0x04 || publicKeyBytes.length !== 65) {
    throw new Error(`Invalid public key format: length=${publicKeyBytes.length}, first byte=${publicKeyBytes[0]}`)
  }
  
  if (privateKeyBytes.length !== 32) {
    throw new Error(`Invalid private key length: ${privateKeyBytes.length}, expected 32`)
  }
  
  // Extract coordinates from public key
  const x = publicKeyBytes.slice(1, 33)
  const y = publicKeyBytes.slice(33, 65)
  
  // Import private key for signing using PKCS#8 format
  // This is more reliable than JWK for Edge Functions
  const pkcs8 = createPKCS8PrivateKey(privateKeyBytes, x, y)
  
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    pkcs8,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  )

  console.log('   ✅ Key imported successfully');

  // Sign the token
  const signatureBuffer = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    cryptoKey,
    encoder.encode(unsignedToken)
  )

  const signature = new Uint8Array(signatureBuffer)
  console.log('   Signature length:', signature.length, 'bytes');
  
  // Convert DER to raw if needed (ES256 requires raw 64-byte signature)
  const rawSignature = signature.length === 64 ? signature : derToRaw(signature)
  console.log('   Raw signature length:', rawSignature.length, 'bytes');
  
  if (rawSignature.length !== 64) {
    throw new Error(`Invalid signature length: ${rawSignature.length}, expected 64`)
  }
  
  const signatureB64 = uint8ArrayToBase64Url(rawSignature)
  const jwt = `${unsignedToken}.${signatureB64}`
  
  console.log('   ✅ JWT generated successfully');
  console.log('   JWT length:', jwt.length, 'chars');
  
  return jwt
}

// Create PKCS#8 DER encoded private key for P-256
function createPKCS8PrivateKey(d: Uint8Array, x: Uint8Array, y: Uint8Array): Uint8Array {
  // PKCS#8 structure for EC private key
  // This is a simplified version that works for P-256
  
  const oid = new Uint8Array([
    0x06, 0x08, // OID tag and length
    0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07 // secp256r1 OID
  ])
  
  // EC Private Key structure
  const version = new Uint8Array([0x02, 0x01, 0x01]) // INTEGER 1
  const privateKeyOctet = new Uint8Array([0x04, 0x20, ...d]) // OCTET STRING (32 bytes)
  const publicKeyBits = new Uint8Array([0xa1, 0x44, 0x03, 0x42, 0x00, 0x04, ...x, ...y])
  
  const ecPrivateKey = new Uint8Array([
    0x30, 0x77, // SEQUENCE
    ...version,
    ...privateKeyOctet,
    0xa0, 0x0a, // [0] EXPLICIT
    ...oid,
    ...publicKeyBits
  ])
  
  // Wrap in PKCS#8 PrivateKeyInfo
  const pkcs8 = new Uint8Array([
    0x30, 0x81, 0x87, // SEQUENCE
    0x02, 0x01, 0x00, // version INTEGER 0
    0x30, 0x13, // AlgorithmIdentifier SEQUENCE
    0x06, 0x07, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02, 0x01, // id-ecPublicKey OID
    ...oid,
    0x04, 0x6d, // PrivateKey OCTET STRING
    ...ecPrivateKey
  ])
  
  return pkcs8
}

// Convert DER signature to raw r||s format
function derToRaw(der: Uint8Array): Uint8Array {
  // DER format: 0x30 [total-length] 0x02 [r-length] [r] 0x02 [s-length] [s]
  let offset = 0
  
  if (der[offset++] !== 0x30) throw new Error('Invalid DER signature')
  offset++ // skip total length
  
  if (der[offset++] !== 0x02) throw new Error('Invalid DER signature')
  const rLength = der[offset++]
  const rOffset = offset
  offset += rLength
  
  if (der[offset++] !== 0x02) throw new Error('Invalid DER signature')
  const sLength = der[offset++]
  const sOffset = offset
  
  // Extract r and s, removing leading zeros if present
  let r = der.slice(rOffset, rOffset + rLength)
  let s = der.slice(sOffset, sOffset + sLength)
  
  // Remove leading zero bytes (added for sign bit)
  if (r.length === 33 && r[0] === 0) r = r.slice(1)
  if (s.length === 33 && s[0] === 0) s = s.slice(1)
  
  // Pad to 32 bytes if needed
  if (r.length < 32) {
    const padded = new Uint8Array(32)
    padded.set(r, 32 - r.length)
    r = padded
  }
  if (s.length < 32) {
    const padded = new Uint8Array(32)
    padded.set(s, 32 - s.length)
    s = padded
  }
  
  // Concatenate r and s
  const raw = new Uint8Array(64)
  raw.set(r.slice(-32), 0)
  raw.set(s.slice(-32), 32)
  
  return raw
}
