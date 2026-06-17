/**
 * Financial and Identity Field Validators
 * These validators enforce Indian financial field formats
 */

/**
 * Validate PAN (Permanent Account Number)
 * Format: AAAAA0000A (5 letters, 4 digits, 1 letter)
 * Example: AAAPA5055K
 */
export function validatePAN(pan: string): { valid: boolean; error?: string } {
  const cleanedPAN = pan.trim().toUpperCase();
  
  if (!cleanedPAN) {
    return { valid: true }; // Optional field
  }
  
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleanedPAN)) {
    return {
      valid: false,
      error: "Invalid PAN format. Expected format: AAAAA0000A (e.g., AAAPA5055K)",
    };
  }
  
  return { valid: true };
}

/**
 * Validate Aadhaar (12-digit biometric identifier)
 * Format: 12 digits, often displayed with spaces (XXXX XXXX XXXX)
 */
export function validateAadhaar(aadhaar: string): { valid: boolean; error?: string } {
  const cleanedAadhaar = aadhaar.trim().replace(/\s+/g, "");
  
  if (!cleanedAadhaar) {
    return { valid: true }; // Optional field
  }
  
  if (!/^\d{12}$/.test(cleanedAadhaar)) {
    return {
      valid: false,
      error: "Invalid Aadhaar format. Expected 12 digits (e.g., 1234 5678 9012)",
    };
  }
  
  return { valid: true };
}

/**
 * Validate IFSC (Indian Financial System Code)
 * Format: 4 uppercase letters + 0 + 6 alphanumeric characters
 * Example: SBIN0000001
 */
export function validateIFSC(ifsc: string): { valid: boolean; error?: string } {
  const cleanedIFSC = ifsc.trim().toUpperCase();
  
  if (!cleanedIFSC) {
    return { valid: true }; // Optional field
  }
  
  if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(cleanedIFSC)) {
    return {
      valid: false,
      error: "Invalid IFSC format. Expected format: AAAA0XXXXXX (e.g., SBIN0000001)",
    };
  }
  
  return { valid: true };
}

/**
 * Validate Bank Account Number
 * Format: 9-18 digits (varies by bank)
 * Common formats: 10-16 digits
 */
export function validateBankAccountNumber(
  account: string,
): { valid: boolean; error?: string } {
  const cleanedAccount = account.trim().replace(/\s+/g, "");
  
  if (!cleanedAccount) {
    return { valid: true }; // Optional field
  }
  
  if (!/^\d{9,18}$/.test(cleanedAccount)) {
    return {
      valid: false,
      error: "Invalid bank account number. Expected 9-18 digits",
    };
  }
  
  return { valid: true };
}

/**
 * Validate email format
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
  const cleanedEmail = email.trim().toLowerCase();
  
  if (!cleanedEmail) {
    return { valid: true }; // Optional field
  }
  
  // RFC 5322 simplified pattern
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanedEmail)) {
    return {
      valid: false,
      error: "Invalid email format",
    };
  }
  
  return { valid: true };
}

/**
 * Validate phone number (E.164 format or Indian format)
 * Expected: 10 digits for India, or +91 followed by 10 digits
 */
export function validatePhoneNumber(phone: string): { valid: boolean; error?: string } {
  const cleanedPhone = phone.trim().replace(/[\s\-()]+/g, "");
  
  if (!cleanedPhone) {
    return { valid: true }; // Optional field
  }
  
  // Accept Indian format: 10 digits or +91 followed by 10 digits
  if (!/^(\+91|91)?\d{10}$/.test(cleanedPhone)) {
    return {
      valid: false,
      error: "Invalid phone number. Expected 10 digits (e.g., 9876543210 or +919876543210)",
    };
  }
  
  return { valid: true };
}

/**
 * Validate salary component (positive number)
 */
export function validateSalaryComponent(
  value: number,
  fieldName: string,
): { valid: boolean; error?: string } {
  if (value < 0) {
    return {
      valid: false,
      error: `${fieldName} cannot be negative`,
    };
  }
  
  if (!Number.isFinite(value)) {
    return {
      valid: false,
      error: `${fieldName} must be a valid number`,
    };
  }
  
  return { valid: true };
}

/**
 * Validate all employee fields
 */
export interface EmployeeValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export function validateEmployee(employee: {
  name?: string;
  email?: string;
  phone_number?: string;
  pan?: string;
  aadhaar_number?: string;
  bank_account_no?: string;
  ifsc_code?: string;
  basic_salary?: number;
  hra?: number;
  special_allowance?: number;
}): EmployeeValidationResult {
  const errors: Record<string, string> = {};
  
  if (!employee.name || employee.name.trim().length < 2) {
    errors.name = "Name is required (minimum 2 characters)";
  }
  
  const emailValidation = validateEmail(employee.email || "");
  if (!emailValidation.valid && employee.email) {
    errors.email = emailValidation.error || "";
  }
  
  const phoneValidation = validatePhoneNumber(employee.phone_number || "");
  if (!phoneValidation.valid && employee.phone_number) {
    errors.phone_number = phoneValidation.error || "";
  }
  
  const panValidation = validatePAN(employee.pan || "");
  if (!panValidation.valid) {
    errors.pan = panValidation.error || "";
  }
  
  const aadhaarValidation = validateAadhaar(employee.aadhaar_number || "");
  if (!aadhaarValidation.valid) {
    errors.aadhaar_number = aadhaarValidation.error || "";
  }
  
  const accountValidation = validateBankAccountNumber(employee.bank_account_no || "");
  if (!accountValidation.valid) {
    errors.bank_account_no = accountValidation.error || "";
  }
  
  const ifscValidation = validateIFSC(employee.ifsc_code || "");
  if (!ifscValidation.valid) {
    errors.ifsc_code = ifscValidation.error || "";
  }
  
  const basicValidation = validateSalaryComponent(employee.basic_salary || 0, "Basic salary");
  if (!basicValidation.valid && employee.basic_salary !== undefined) {
    errors.basic_salary = basicValidation.error || "";
  }
  
  const hraValidation = validateSalaryComponent(employee.hra || 0, "HRA");
  if (!hraValidation.valid && employee.hra) {
    errors.hra = hraValidation.error || "";
  }
  
  const allowanceValidation = validateSalaryComponent(
    employee.special_allowance || 0,
    "Special allowance",
  );
  if (!allowanceValidation.valid && employee.special_allowance) {
    errors.special_allowance = allowanceValidation.error || "";
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
