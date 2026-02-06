/**
 * Wallet Service
 * 
 * Handles wallet balance, withdrawals, and transaction history.
 */

import { apiGet, apiPost, ApiClientError } from "@/utils/apiClient";

export interface WalletBalance {
  availableBalance: number;
  pendingBalance: number;
  totalEarnings: number;
  currency: string;
}

export interface WithdrawRequest {
  amount: number;
  bankAccountId: string;
  idempotencyKey?: string; // Prevent duplicate withdrawals
}

export interface WithdrawResponse {
  success: boolean;
  transactionId: string;
  amount: number;
  status: "pending" | "processing" | "completed" | "failed";
  message?: string;
  error?: string;
  estimatedCompletionTime?: string; // ISO date string
}

export type TransactionType = "credit" | "debit";
export type TransactionStatus = "pending" | "processing" | "completed" | "failed";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  description: string;
  referenceId: string;
  createdAt: string;
  completedAt?: string;
  metadata?: {
    bankAccountId?: string;
    bankName?: string;
    paymentMode?: string;
    failureReason?: string;
  };
}

export interface TransactionHistoryParams {
  page?: number;
  limit?: number;
  type?: TransactionType;
  status?: TransactionStatus;
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
}

export interface TransactionHistoryResponse {
  transactions: Transaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/** Backend returns { success: true, data: T } for balance, history, transaction */
interface ApiDataResponse<T> {
  success: boolean;
  data: T;
}

/** Current month earnings breakdown from GET /wallet/earnings-breakdown */
export interface EarningsBreakdown {
  basePay: number;
  baseHours: number;
  overtime: number;
  overtimeHours: number;
  performance: number;
  attendance: number;
  accuracy: number;
  referral: number;
  grossPay: number;
  deductions: { tds: number };
  netPayout: number;
  incentives?: { referral: number; bonus: number; total: number };
}

/**
 * Get wallet balance
 * GET /wallet/balance – returns { success, data: WalletBalance }
 */
export async function getWalletBalance(): Promise<WalletBalance> {
  const res = await apiGet<ApiDataResponse<WalletBalance>>("/wallet/balance");
  return (res as ApiDataResponse<WalletBalance>).data;
}

/**
 * Initiate withdrawal
 * 
 * Creates a withdrawal request. The backend will:
 * 1. Validate balance
 * 2. Create transaction record
 * 3. Process payment via payment gateway
 * 4. Return transaction status
 */
export async function withdrawAmount(
  request: WithdrawRequest
): Promise<WithdrawResponse> {
  // Generate idempotency key if not provided
  const idempotencyKey = request.idempotencyKey || `withdraw_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const response = await apiPost<WithdrawResponse>("/wallet/withdraw", {
      ...request,
      idempotencyKey,
    });
    return response;
  } catch (error) {
    if (error instanceof ApiClientError) {
      return {
        success: false,
        transactionId: "",
        amount: request.amount,
        status: "failed",
        error: error.message,
      };
    }
    throw error;
  }
}

/**
 * Get transaction history
 * GET /wallet/history – returns { success, data: { transactions, pagination } }
 */
export async function getTransactionHistory(
  params?: TransactionHistoryParams
): Promise<TransactionHistoryResponse> {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append("page", params.page.toString());
  if (params?.limit) queryParams.append("limit", params.limit.toString());
  if (params?.type) queryParams.append("type", params.type);
  if (params?.status) queryParams.append("status", params.status);
  if (params?.startDate) queryParams.append("startDate", params.startDate);
  if (params?.endDate) queryParams.append("endDate", params.endDate);
  const queryString = queryParams.toString();
  const endpoint = `/wallet/history${queryString ? `?${queryString}` : ""}`;
  const res = await apiGet<ApiDataResponse<TransactionHistoryResponse>>(endpoint);
  return (res as ApiDataResponse<TransactionHistoryResponse>).data;
}

/**
 * Get transaction by ID
 * GET /wallet/transactions/:transactionId – returns { success, data: Transaction }
 */
export async function getTransaction(transactionId: string): Promise<Transaction> {
  const res = await apiGet<ApiDataResponse<Transaction>>(`/wallet/transactions/${transactionId}`);
  return (res as ApiDataResponse<Transaction>).data;
}

/**
 * Check withdrawal status
 */
export async function checkWithdrawalStatus(transactionId: string): Promise<WithdrawResponse> {
  const transaction = await getTransaction(transactionId);
  
  return {
    success: transaction.status === "completed",
    transactionId: transaction.id,
    amount: transaction.amount,
    status: transaction.status as "pending" | "processing" | "completed" | "failed",
    message: transaction.status === "completed" ? "Withdrawal completed successfully" : undefined,
    error: transaction.metadata?.failureReason,
  };
}

/**
 * Get current month earnings breakdown for payouts screen
 * GET /wallet/earnings-breakdown
 */
export async function getEarningsBreakdown(): Promise<EarningsBreakdown | null> {
  try {
    const res = await apiGet<ApiDataResponse<EarningsBreakdown>>("/wallet/earnings-breakdown");
    return (res as ApiDataResponse<EarningsBreakdown>).data ?? null;
  } catch (error) {
    if (error instanceof ApiClientError) {
      return null;
    }
    throw error;
  }
}
