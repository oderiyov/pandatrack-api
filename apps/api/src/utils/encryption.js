// apps/api/src/utils/encryption.js
const crypto = require('crypto');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const TRACKING_SALT = process.env.TRACKING_SALT;

if (!ENCRYPTION_KEY || !TRACKING_SALT) {
    throw new Error('Encryption keys not found in environment variables');
}

// Безпечне шифрування GCM (ваш поточний код ПРАВИЛЬНИЙ)
function encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipherGCM('aes-256-gcm', Buffer.from(ENCRYPTION_KEY, 'hex'));
    cipher.setAAD(Buffer.from('pandatrack-v1'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

function decrypt(text) {
    const [ivHex, authTagHex, encrypted] = text.split(':');
    
    if (!ivHex || !authTagHex || !encrypted) {
        throw new Error('Invalid encrypted data format');
    }
    
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipherGCM('aes-256-gcm', Buffer.from(ENCRYPTION_KEY, 'hex'));
    
    decipher.setAAD(Buffer.from('pandatrack-v1'));
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
}

// Хешування для безпеки
function hashTrackingNumber(trackingNumber) {
    return crypto
        .createHmac('sha256', TRACKING_SALT)
        .update(trackingNumber)
        .digest('hex')
        .substring(0, 16);
}

module.exports = {
    encrypt,
    decrypt,
    hashTrackingNumber
};