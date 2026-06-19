// utils/generateReferralCode.js

/**
 * Generate a unique referral code for a user
 * Format: FIRE + 6 random digits + first 3 letters of name
 * Example: FIRE123456RAJ
 */

export const generateReferralCode = (userId, name = "") => {
  // Generate 6 random digits (100000 to 999999)
  const randomDigits = Math.floor(100000 + Math.random() * 900000);
  
  // Get first 3 letters of name (uppercase), or "USR" if name not provided
  let nameCode = "USR";
  if (name && name.length > 0) {
    // Remove spaces and special characters, take first 3 letters
    const cleanName = name.replace(/[^a-zA-Z]/g, "").toUpperCase();
    nameCode = cleanName.substring(0, 3);
    if (nameCode.length < 3) {
      nameCode = nameCode.padEnd(3, "X");
    }
  }
  
  // Combine to create referral code
  const referralCode = `FIRE${randomDigits}${nameCode}`;
  
  return referralCode;
};

/**
 * Generate a simple numeric referral code
 * Format: 6 digits only
 * Example: 123456
 */
export const generateSimpleReferralCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Generate an alphanumeric referral code
 * Format: 8 characters (letters + numbers)
 * Example: A7B3F9K2
 */
export const generateAlphaNumericReferralCode = (length = 8) => {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

/**
 * Check if referral code is valid format
 */
export const isValidReferralCodeFormat = (code) => {
  if (!code || typeof code !== "string") return false;
  
  // Check FIRE + 6 digits + 3 letters format
  const fireFormat = /^FIRE\d{6}[A-Z]{3}$/;
  if (fireFormat.test(code)) return true;
  
  // Check simple 6-digit format
  const simpleFormat = /^\d{6}$/;
  if (simpleFormat.test(code)) return true;
  
  // Check alphanumeric 8-character format
  const alphaNumFormat = /^[A-Z0-9]{8}$/;
  if (alphaNumFormat.test(code)) return true;
  
  return false;
};

/**
 * Generate multiple referral codes at once
 * @param {number} count - Number of codes to generate
 * @returns {Array} Array of unique referral codes
 */
export const generateMultipleReferralCodes = (count = 10) => {
  const codes = new Set();
  
  while (codes.size < count) {
    codes.add(generateAlphaNumericReferralCode(8));
  }
  
  return Array.from(codes);
};

/**
 * Generate a referral code with custom prefix
 * @param {string} prefix - Custom prefix (e.g., "BGMI", "FF", "SOLO")
 * @param {number} length - Length of random part
 * @returns {string} Referral code
 */
export const generateCustomReferralCode = (prefix = "FIRE", length = 6) => {
  const randomPart = generateAlphaNumericReferralCode(length);
  return `${prefix}${randomPart}`.toUpperCase();
};

/**
 * Format referral code for display (add spaces for readability)
 * @param {string} code - Original referral code
 * @returns {string} Formatted code (e.g., "FIRE 123 456 RAJ")
 */
export const formatReferralCodeForDisplay = (code) => {
  if (!code) return "";
  
  // Format FIRE123456RAJ -> FIRE 123 456 RAJ
  if (code.startsWith("FIRE") && code.length === 13) {
    const fire = code.substring(0, 4);
    const firstThree = code.substring(4, 7);
    const secondThree = code.substring(7, 10);
    const nameCode = code.substring(10, 13);
    return `${fire} ${firstThree} ${secondThree} ${nameCode}`;
  }
  
  // Format 123456 -> 123 456
  if (/^\d{6}$/.test(code)) {
    return `${code.substring(0, 3)} ${code.substring(3, 6)}`;
  }
  
  // Format A7B3F9K2 -> A7B3 F9K2
  if (code.length === 8) {
    return `${code.substring(0, 4)} ${code.substring(4, 8)}`;
  }
  
  return code;
};

/**
 * Validate referral code against a list of existing codes
 * @param {string} code - Referral code to validate
 * @param {Array} existingCodes - List of existing valid codes
 * @returns {boolean} True if code exists in list
 */
export const isReferralCodeValid = async (code, existingCodes) => {
  if (!code || !existingCodes) return false;
  return existingCodes.includes(code);
};

/**
 * Extract user info from referral code (for FIRE format)
 * @param {string} code - Referral code in FIRE format
 * @returns {Object} Extracted info
 */
export const extractInfoFromReferralCode = (code) => {
  if (!code || !code.startsWith("FIRE") || code.length !== 13) {
    return null;
  }
  
  return {
    prefix: code.substring(0, 4),     // "FIRE"
    firstPart: code.substring(4, 7),  // First 3 digits
    secondPart: code.substring(7, 10), // Second 3 digits
    nameCode: code.substring(10, 13),  // Name code
    fullCode: code
  };
};

export default {
  generateReferralCode,
  generateSimpleReferralCode,
  generateAlphaNumericReferralCode,
  isValidReferralCodeFormat,
  generateMultipleReferralCodes,
  generateCustomReferralCode,
  formatReferralCodeForDisplay,
  isReferralCodeValid,
  extractInfoFromReferralCode
};