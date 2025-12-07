import crypto from 'crypto';

const frontendKey = 'BGTEAag0_lKOToSElyiwSSMmtLG7V6paCY8EE51pC6FI6IJBl2uPoHb3KaVydzxQHmQJZ6izx_eN_Dq7bYv8dOk';
const expectedDigest = 'dcb19ebf3fe011ff028aaca027e7343a0fde2ecee8c341c49490443a3449ac1c';

// Compute SHA-256 hash of the frontend key
const hash = crypto.createHash('sha256').update(frontendKey).digest('hex');

console.log('Frontend VAPID Key:', frontendKey);
console.log('Computed Hash:', hash);
console.log('Expected Hash:', expectedDigest);
console.log('Match:', hash === expectedDigest ? '✅ YES' : '❌ NO');
