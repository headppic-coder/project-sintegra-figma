/**
 * Phone Number Utilities
 * Standardize phone numbers dengan format: [country_code][number_without_leading_zero]
 * Example: 6281392819234 (Indonesia), 601234567890 (Malaysia)
 */

interface PhoneFormatResult {
  formatted: string;
  isValid: boolean;
  error?: string;
}

// Country codes
export const COUNTRY_CODES = {
  INDONESIA: '62',
  MALAYSIA: '60',
  SINGAPORE: '65',
  THAILAND: '66',
  PHILIPPINES: '63',
  VIETNAM: '84',
  MYANMAR: '95',
  USA: '1',
};

/**
 * Format phone number to standard format
 * Input: "0813-9281-9234" or "081392819234" or "+62 813 9281 9234"
 * Output: "6281392819234"
 */
export function formatPhoneNumber(
  phone: string,
  defaultCountryCode: string = COUNTRY_CODES.INDONESIA
): PhoneFormatResult {
  if (!phone || phone.trim() === '') {
    return {
      formatted: '',
      isValid: false,
      error: 'Nomor telepon tidak boleh kosong'
    };
  }

  // Remove all non-numeric characters (spaces, dashes, parentheses, plus signs)
  let cleanNumber = phone.replace(/\D/g, '');

  // If number starts with '+', it was removed, so we need to detect country code
  if (phone.startsWith('+')) {
    // Already has country code, just clean it
    if (cleanNumber.length < 10) {
      return {
        formatted: cleanNumber,
        isValid: false,
        error: 'Nomor telepon terlalu pendek'
      };
    }
  } else if (cleanNumber.startsWith('0')) {
    // Remove leading zero and add default country code
    cleanNumber = defaultCountryCode + cleanNumber.substring(1);
  } else if (!cleanNumber.startsWith(defaultCountryCode)) {
    // No country code and no leading zero, assume it's missing
    // Check if it looks like a valid mobile number
    if (cleanNumber.length >= 9 && cleanNumber.length <= 15) {
      cleanNumber = defaultCountryCode + cleanNumber;
    }
  }

  // Validate length (international phone numbers are typically 10-15 digits with country code)
  if (cleanNumber.length < 10 || cleanNumber.length > 15) {
    return {
      formatted: cleanNumber,
      isValid: false,
      error: 'Panjang nomor tidak valid (harus 10-15 digit termasuk kode negara)'
    };
  }

  // Validate country code
  const validCountryCodes = Object.values(COUNTRY_CODES);
  const hasValidCountryCode = validCountryCodes.some(code =>
    cleanNumber.startsWith(code)
  );

  if (!hasValidCountryCode) {
    return {
      formatted: cleanNumber,
      isValid: false,
      error: 'Kode negara tidak valid'
    };
  }

  return {
    formatted: cleanNumber,
    isValid: true
  };
}

/**
 * Display phone number (for display only, not storage)
 * Input: "6281392819234"
 * Output: "6281392819234" (no spaces, just numbers)
 */
export function displayPhoneNumber(phone: string): string {
  if (!phone || phone.trim() === '') return '';

  // Remove any non-numeric characters first
  const cleanNumber = phone.replace(/\D/g, '');

  // Return just the clean number (no formatting, no spaces)
  return cleanNumber;
}

/**
 * Validate phone number
 */
export function isValidPhoneNumber(phone: string): boolean {
  const result = formatPhoneNumber(phone);
  return result.isValid;
}

/**
 * Auto-format phone number as user types (for input field)
 * This provides real-time feedback while typing
 */
export function autoFormatPhoneInput(value: string, currentPosition: number = 0): {
  formatted: string;
  cursorPosition: number;
} {
  // Remove all non-numeric characters
  const numbersOnly = value.replace(/\D/g, '');

  // Don't format if empty
  if (numbersOnly === '') {
    return { formatted: '', cursorPosition: 0 };
  }

  // Return just numbers (we'll format on blur)
  return {
    formatted: numbersOnly,
    cursorPosition: numbersOnly.length
  };
}

/**
 * Normalize phone number from various formats to standard format
 * Useful for migrating old data
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  const result = formatPhoneNumber(phone);
  return result.isValid ? result.formatted : phone;
}

/**
 * Get phone number examples for different countries
 */
export function getPhoneExample(countryCode: string): string {
  const examples: Record<string, string> = {
    [COUNTRY_CODES.INDONESIA]: '6281234567890',
    [COUNTRY_CODES.MALAYSIA]: '60123456789',
    [COUNTRY_CODES.SINGAPORE]: '6591234567',
    [COUNTRY_CODES.THAILAND]: '66812345678',
    [COUNTRY_CODES.PHILIPPINES]: '639171234567',
    [COUNTRY_CODES.VIETNAM]: '84912345678',
  };
  return examples[countryCode] || '6281234567890';
}

/**
 * Extract country code from phone number
 */
export function extractCountryCode(phone: string): string {
  const cleanNumber = phone.replace(/\D/g, '');
  const validCodes = Object.values(COUNTRY_CODES).sort((a, b) => b.length - a.length);

  for (const code of validCodes) {
    if (cleanNumber.startsWith(code)) {
      return code;
    }
  }

  return COUNTRY_CODES.INDONESIA; // Default
}

/**
 * Format phone number for WhatsApp link
 * WhatsApp expects: country code + number without leading zero
 */
export function formatPhoneForWhatsApp(phone: string): string {
  const result = formatPhoneNumber(phone);
  return result.isValid ? result.formatted : '';
}
