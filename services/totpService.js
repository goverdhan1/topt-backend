const { authenticator } = require('otplib');
const QRCode = require('qrcode');

class TotpService {
  /**
   * Generate a new TOTP secret
   * @returns {string} Base32 encoded secret
   */
  generateSecret() {
    return authenticator.generateSecret();
  }

  /**
   * Generate QR code data for the secret
   * @param {string} secret - TOTP secret
   * @param {string} label - Label for the QR code (e.g., "Account:email")
   * @returns {Promise<{svg: string, base64: string}>} QR code in SVG and base64 formats
   */
  async getQRData(secret, label) {
    const otpauth = authenticator.keyuri(label, 'OTPService', secret);
    const svg = await QRCode.toString(otpauth, { type: 'svg', width: 200 });
    const base64 = await QRCode.toDataURL(otpauth);
    return { svg, base64 };
  }

  /**
   * Verify a TOTP code against the secret
   * @param {string} secret - TOTP secret
   * @param {string} code - 6-digit TOTP code
   * @returns {boolean} True if valid
   */
  verifyCode(secret, code) {
    return authenticator.check(code, secret);
  }
}

module.exports = new TotpService();
