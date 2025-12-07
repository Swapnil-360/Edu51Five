// VAPID JWT generation using jose library (proven and reliable)
import { SignJWT } from 'https://deno.land/x/jose@v5.2.0/index.ts'
import { base64UrlToUint8Array } from './webpush-encrypt.ts'

export async function generateVapidAuthToken(
  audience: string,
  subject: string,
  privateKeyBase64: string,
  publicKeyBase64: string
): Promise<string> {
  console.log('🔐 Generating VAPID JWT with jose library...')
  console.log('   Audience:', audience)
  console.log('   Subject:', subject)
  
  // Decode the keys
  const publicKeyBytes = base64UrlToUint8Array(publicKeyBase64)
  const privateKeyBytes = base64UrlToUint8Array(privateKeyBase64)
  
  // Validate
  if (publicKeyBytes[0] !== 0x04 || publicKeyBytes.length !== 65) {
    throw new Error('Invalid public key format')
  }
  
  if (privateKeyBytes.length !== 32) {
    throw new Error('Invalid private key length')
  }
  
  // Extract x, y coordinates from public key
  const x = publicKeyBytes.slice(1, 33)
  const y = publicKeyBytes.slice(33, 65)
  
  // Convert to base64url for JWK (jose requires this format)
  const xB64 = btoa(String.fromCharCode(...x))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
  
  const yB64 = btoa(String.fromCharCode(...y))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
  
  const dB64 = btoa(String.fromCharCode(...privateKeyBytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
  
  // Create JWK
  const jwk = {
    kty: 'EC',
    crv: 'P-256',
    x: xB64,
    y: yB64,
    d: dB64
  }
  
  console.log('   JWK created successfully')
  
  // Import key using jose
  const privateKey = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign']
  )
  
  console.log('   Private key imported')
  
  // Create JWT using jose
  const now = Math.floor(Date.now() / 1000)
  const jwt = await new SignJWT({})
    .setProtectedHeader({ alg: 'ES256', typ: 'JWT' })
    .setAudience(audience)
    .setSubject(subject)
    .setExpirationTime(now + 43200) // 12 hours
    .sign(privateKey)
  
  console.log('   ✅ JWT signed successfully')
  console.log('   JWT length:', jwt.length, 'chars')
  
  return jwt
}
