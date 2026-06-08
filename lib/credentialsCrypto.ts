import crypto from 'crypto';

const ALGO = 'aes-256-gcm';

function getEncryptionKey(): Buffer {
  const raw = process.env.CREDENTIALS_ENCRYPTION_KEY || '';
  if (!raw.trim()) {
    throw new Error('Missing CREDENTIALS_ENCRYPTION_KEY.');
  }

  const isHex = /^[0-9a-fA-F]{64}$/.test(raw.trim());
  if (isHex) {
    return Buffer.from(raw.trim(), 'hex');
  }

  return crypto.createHash('sha256').update(raw).digest();
}

export function encryptCredentialSecret(plainText: string): string {
  const iv = crypto.randomBytes(12);
  const key = getEncryptionKey();
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
}
