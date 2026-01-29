/**
 * Bank Service
 * 
 * Handles bank account verification and management.
 * Integrates with payment gateway APIs (Razorpay/Cashfree/Stripe Treasury).
 */

import { apiPost, apiGet, apiPut, ApiClientError } from "@/utils/apiClient";

export interface BankAccountDetails {
  accountHolder: string;
  accountNumber: string;
  ifscCode: string;
  bankName?: string;
  branch?: string;
}

export interface BankVerificationRequest {
  accountHolder: string;
  accountNumber: string;
  ifscCode: string;
  bankName?: string;
  branch?: string;
}

export interface BankVerificationResponse {
  success: boolean;
  verified: boolean;
  bankAccountId?: string;
  bankName?: string;
  branch?: string;
  message?: string;
  error?: string;
}

export interface SavedBankAccount {
  id: string;
  accountHolder: string;
  accountNumber: string; // Masked (last 4 digits)
  ifscCode: string;
  bankName: string;
  branch?: string;
  isVerified: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Verify bank account details
 * 
 * This calls the backend API which:
 * 1. Validates format (client-side validation should be done first)
 * 2. Calls payment gateway API (Razorpay/Cashfree) for real account verification
 * 3. Returns verification status
 */
export async function verifyBankAccount(
  details: BankVerificationRequest
): Promise<BankVerificationResponse> {
  try {
    const response = await apiPost<BankVerificationResponse>("/bank/verify", details);
    return response;
  } catch (error) {
    if (error instanceof ApiClientError) {
      return {
        success: false,
        verified: false,
        error: error.message,
      };
    }
    throw error;
  }
}

/**
 * Save verified bank account
 * 
 * Saves bank account after successful verification.
 */
export async function saveBankAccount(
  details: BankAccountDetails
): Promise<SavedBankAccount> {
  return apiPost<SavedBankAccount>("/bank/accounts", details);
}

/**
 * Get saved bank accounts
 */
export async function getBankAccounts(): Promise<SavedBankAccount[]> {
  return apiGet<SavedBankAccount[]>("/bank/accounts");
}

/**
 * Get default bank account
 */
export async function getDefaultBankAccount(): Promise<SavedBankAccount | null> {
  try {
    const accounts = await getBankAccounts();
    return accounts.find((acc) => acc.isDefault) || accounts[0] || null;
  } catch {
    return null;
  }
}

/**
 * Update bank account
 */
export async function updateBankAccount(
  accountId: string,
  details: Partial<BankAccountDetails>
): Promise<SavedBankAccount> {
  return apiPut<SavedBankAccount>(`/bank/accounts/${accountId}`, details);
}

/**
 * Set default bank account
 */
export async function setDefaultBankAccount(accountId: string): Promise<SavedBankAccount> {
  return apiPut<SavedBankAccount>(`/bank/accounts/${accountId}/set-default`, {});
}

/**
 * Delete bank account
 */
export async function deleteBankAccount(accountId: string): Promise<void> {
  return apiPost<void>(`/bank/accounts/${accountId}/delete`, {});
}

/**
 * Client-side validation helpers (hard-coded, minimal rules).
 * Used for instant, non-blocking validation on button click.
 */
export function validateIFSC(ifsc: string): boolean {
  return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc.toUpperCase());
}

export function validateAccountNumber(accountNumber: string): boolean {
  return /^\d{9,18}$/.test(accountNumber);
}

export function validateAccountHolder(holderName: string): boolean {
  return /^[a-zA-Z\s]{2,100}$/.test(holderName.trim());
}

/** Result of lightweight bank form validation */
export interface BankFormValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Lightweight bank validation – single sync pass, mandatory fields only.
 * Runs instantly on button click; no API, no heavy logic.
 * Order: holder → account number → IFSC (fail fast, one message).
 */
export function validateBankForm(
  holderName: string,
  accountNumber: string,
  ifscCode: string
): BankFormValidationResult {
  const holder = holderName.trim();
  const acc = accountNumber.trim();
  const ifsc = ifscCode.trim().toUpperCase();

  if (!holder) return { valid: false, error: "Account holder name is required." };
  if (!validateAccountHolder(holder)) return { valid: false, error: "Account holder: 2–100 characters, letters and spaces only." };
  if (!acc) return { valid: false, error: "Account number is required." };
  if (!validateAccountNumber(acc)) return { valid: false, error: "Account number: 9–18 digits only." };
  if (!ifsc) return { valid: false, error: "IFSC code is required." };
  if (!validateIFSC(ifsc)) return { valid: false, error: "IFSC: 11 characters (e.g. HDFC0001234)." };

  return { valid: true };
}

/** Dummy values for demo/dev – pass validation without calling real API */
const DUMMY_BANK = {
  accountNumber: "1234567890123456",
  ifsc: "HDFC0001234",
  holderNames: ["test user", "demo user", "demo account"],
};

/**
 * Returns true if the given details match dummy demo values (for dev/demo mode).
 * Use to skip real verify/save API and set local bank details.
 */
export function isDummyBankDetails(
  holderName: string,
  accountNumber: string,
  ifscCode: string
): boolean {
  const holder = holderName.trim().toLowerCase();
  const account = accountNumber.trim();
  const ifsc = ifscCode.trim().toUpperCase();
  const holderMatch = DUMMY_BANK.holderNames.some((h) => holder.includes(h) || h.includes(holder));
  return (
    holderMatch &&
    account === DUMMY_BANK.accountNumber &&
    ifsc === DUMMY_BANK.ifsc
  );
}

/**
 * Returns a verification response for dummy bank details (no API call).
 */
export function getDummyVerificationResponse(): BankVerificationResponse {
  return {
    success: true,
    verified: true,
    bankName: "HDFC Bank",
    branch: "Demo Branch",
  };
}

/**
 * Masks account number for display (last 4 visible).
 */
export function maskAccountNumber(accountNumber: string): string {
  if (!accountNumber || accountNumber.length < 4) return "****";
  return `****${accountNumber.slice(-4)}`;
}
