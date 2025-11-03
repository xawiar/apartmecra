const crypto = require('crypto');

const ALGO = 'aes-256-gcm';
const KEY_HEX = (process.env.FIELD_ENCRYPTION_KEY || '').trim();
if (!KEY_HEX) {
  console.warn('[crypto] FIELD_ENCRYPTION_KEY missing; using insecure default for development');
}
const KEY = Buffer.from(KEY_HEX || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef', 'hex');

function encryptField(plaintext) {
  if (plaintext === null || plaintext === undefined) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, KEY, iv);
  const enc = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}.${tag.toString('base64')}.${enc.toString('base64')}`;
}

function decryptField(ciphertext) {
  if (!ciphertext) return null;
  try {
    const [ivB64, tagB64, dataB64] = String(ciphertext).split('.');
    if (!ivB64 || !tagB64 || !dataB64) return ciphertext; // already plaintext
    const iv = Buffer.from(ivB64, 'base64');
    const tag = Buffer.from(tagB64, 'base64');
    const data = Buffer.from(dataB64, 'base64');
    const decipher = crypto.createDecipheriv(ALGO, KEY, iv);
    decipher.setAuthTag(tag);
    const dec = Buffer.concat([decipher.update(data), decipher.final()]);
    return dec.toString('utf8');
  } catch (_) {
    // Return original if not decryptable
    return ciphertext;
  }
}

module.exports = { encryptField, decryptField };


