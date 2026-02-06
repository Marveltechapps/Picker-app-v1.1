/**
 * Auth service – real-time OTP authentication.
 * DEV MODE (OTP_DEV_MODE=1 or config): random 4-digit OTP, no SMS, no rate/attempt limits, OTP in response.
 * PRODUCTION: SMS gateway, rate limits, attempt limits; no OTP in response.
 */
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const Otp = require('../models/otp.model');
const { sendOtpSms } = require('./sms.service');
const { isOtpDevMode } = require('../config/otp.config');
const { withTimeout, DB_TIMEOUT_MS } = require('../utils/realtime.util');
const {
  OTP_MIN,
  OTP_MAX,
  OTP_TTL_MS,
  RESEND_COOLDOWN_MS,
  RESEND_WINDOW_MINUTES,
  RESEND_MAX_PER_WINDOW,
  VERIFY_MAX_WRONG_ATTEMPTS,
  VERIFY_WRONG_ATTEMPTS_WINDOW_MS,
  DEV_FIXED_OTP,
  OTP_ERROR_CODES,
} = require('../config/otp.constants');

const JWT_SECRET = process.env.JWT_SECRET || 'picker-app-secret-change-in-production';

/** 4-digit numeric OTP (1000–9999). Used for both DEV and PROD; in DEV we always use this (never static). */
const generateOtp = () => Math.floor(OTP_MIN + Math.random() * (OTP_MAX - OTP_MIN + 1)).toString();

/** DEV MODE: normalize to digits only; accept any 10-digit number. Returns null if not 10 digits. */
function normalizePhoneDev(phone) {
  const digits = String(phone ?? '').replace(/\D/g, '');
  return digits.length === 10 ? digits : null;
}

/** Resend limit: per-phone, in-memory. Only successful SMS sends are counted. { phone -> { lastSentAt, count, windowStart } } */
const resendStore = new Map();
const RESEND_WINDOW_MS = RESEND_WINDOW_MINUTES * 60 * 1000;

/** Check if we are allowed to send (read-only). Rate limit applies only to successful sends. */
function checkResendLimit(phone) {
  const now = Date.now();
  const entry = resendStore.get(phone);
  if (!entry) return { allowed: true };
  if (now - entry.lastSentAt < RESEND_COOLDOWN_MS) {
    return { allowed: false, reason: OTP_ERROR_CODES.RATE_LIMIT, message: 'OTP already sent recently. Please wait a minute before requesting again.' };
  }
  if (now - entry.windowStart >= RESEND_WINDOW_MS) return { allowed: true };
  if (entry.count >= RESEND_MAX_PER_WINDOW) {
    return { allowed: false, reason: OTP_ERROR_CODES.RATE_LIMIT, message: 'Daily SMS limit exceeded. Please try again later.' };
  }
  return { allowed: true };
}

/** Call only after SMS is successfully sent. Updates rate-limit state. */
function recordSuccessfulSend(phone) {
  const now = Date.now();
  let entry = resendStore.get(phone);
  if (!entry) {
    resendStore.set(phone, { lastSentAt: now, count: 1, windowStart: now });
    return;
  }
  if (now - entry.windowStart >= RESEND_WINDOW_MS) {
    resendStore.set(phone, { lastSentAt: now, count: 1, windowStart: now });
    return;
  }
  entry.count += 1;
  entry.lastSentAt = now;
  resendStore.set(phone, entry);
}

/** Clear rate-limit entry for this phone so user can retry after a failed SMS. */
function clearResendEntry(phone) {
  resendStore.delete(phone);
}

/** Wrong OTP attempts: per-phone, in-memory. { phone -> { count, windowStart } } */
const wrongAttemptStore = new Map();

function checkWrongAttemptLimit(phone) {
  const now = Date.now();
  let entry = wrongAttemptStore.get(phone);
  if (!entry) return { allowed: true, count: 0 };
  if (now - entry.windowStart >= VERIFY_WRONG_ATTEMPTS_WINDOW_MS) {
    wrongAttemptStore.delete(phone);
    return { allowed: true, count: 0 };
  }
  if (entry.count >= VERIFY_MAX_WRONG_ATTEMPTS) {
    return { allowed: false, message: 'Too many wrong attempts. Please request a new OTP after some time.' };
  }
  return { allowed: true, count: entry.count };
}

function recordWrongAttempt(phone) {
  const now = Date.now();
  let entry = wrongAttemptStore.get(phone);
  if (!entry) {
    wrongAttemptStore.set(phone, { count: 1, windowStart: now });
    return;
  }
  if (now - entry.windowStart >= VERIFY_WRONG_ATTEMPTS_WINDOW_MS) {
    wrongAttemptStore.set(phone, { count: 1, windowStart: now });
    return;
  }
  entry.count += 1;
  wrongAttemptStore.set(phone, entry);
}

function clearWrongAttempts(phone) {
  wrongAttemptStore.delete(phone);
}

/**
 * Normalize phone: digits only. Any length. Reject if empty or non-numeric.
 */
function normalizePhone(phone) {
  const digits = String(phone ?? '').replace(/\D/g, '');
  return digits.length > 0 ? digits : null;
}

/**
 * Send OTP: validate phone, check resend limit, send SMS first. Only on SMS success: store OTP and apply rate limit.
 * If SMS fails: no OTP stored, no rate limit, return clear error.
 * DEV MODE: random OTP every time, no SMS, no rate limits, OTP returned in response.
 */
const sendOtp = async (phone) => {
  if (phone === undefined || phone === null) {
    return { success: false, message: 'Phone number is required', errorCode: OTP_ERROR_CODES.INVALID_PHONE };
  }

  // ----- DEV MODE: random OTP, no SMS, no rate limits, accept any 10-digit phone -----
  if (isOtpDevMode()) {
    const trimmed = normalizePhoneDev(phone);
    if (!trimmed) {
      return { success: false, message: 'Phone number must be 10 digits', errorCode: OTP_ERROR_CODES.INVALID_PHONE };
    }
    const code = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);
    try {
      await withTimeout(
        Promise.all([
          Otp.deleteMany({ phone: trimmed }),
          Otp.create({ phone: trimmed, code, expiresAt }),
        ]),
        DB_TIMEOUT_MS
      );
    } catch (err) {
      console.warn('[auth] sendOtp DB failed (dev):', err?.message);
      return { success: false, message: 'Unable to store OTP. Please try again.', errorCode: OTP_ERROR_CODES.SMS_GATEWAY_ERROR };
    }
    console.log('[auth] DEV send-otp for', trimmed, '→ OTP:', code);
    return { success: true, message: 'OTP sent successfully (dev mode)', otp: code };
  }

  // ----- PRODUCTION: rate limits, real SMS -----
  const trimmed = normalizePhone(phone);
  if (!trimmed) {
    return { success: false, message: 'Invalid phone number. Phone must be numeric only.', errorCode: OTP_ERROR_CODES.INVALID_PHONE };
  }

  const resendCheck = checkResendLimit(trimmed);
  if (!resendCheck.allowed) {
    return { success: false, message: resendCheck.message, errorCode: resendCheck.reason || OTP_ERROR_CODES.RATE_LIMIT };
  }

  const code = generateOtp();

  console.log('[auth] Sending SMS to', trimmed, 'via gateway (real SMS)...');
  const smsResult = await sendOtpSms(trimmed, code, 5);

  if (!smsResult.sent) {
    clearResendEntry(trimmed);
    console.warn('[auth] SMS NOT sent. errorCode:', smsResult.errorCode || '-', '| userMessage:', smsResult.userMessage || '-');
    if (smsResult.internalLog) console.warn('[auth] SMS details:', smsResult.internalLog);
    return {
      success: false,
      message: smsResult.userMessage || 'SMS failed. Please check the number and try again.',
      errorCode: smsResult.errorCode || OTP_ERROR_CODES.SMS_GATEWAY_ERROR,
    };
  }

  try {
    await withTimeout(
      Promise.all([
        Otp.deleteMany({ phone: trimmed }),
        Otp.create({ phone: trimmed, code, expiresAt: new Date(Date.now() + OTP_TTL_MS) }),
      ]),
      DB_TIMEOUT_MS
    );
  } catch (err) {
    console.warn('[auth] sendOtp DB failed after SMS sent:', err?.message);
    return { success: false, message: 'OTP was sent but could not be stored. Please try again.', errorCode: OTP_ERROR_CODES.SMS_GATEWAY_ERROR };
  }
  recordSuccessfulSend(trimmed);
  return { success: true, message: 'OTP sent successfully' };
};

/**
 * Resend OTP: same flow as sendOtp – normalize, check resend limit, send SMS first, store OTP and rate limit only on success.
 * DEV MODE: always generate new OTP, overwrite previous, return new OTP; no rate limits.
 */
const resendOtp = async (phone) => {
  if (phone === undefined || phone === null) {
    return { success: false, message: 'Phone number is required', errorCode: OTP_ERROR_CODES.INVALID_PHONE };
  }

  // ----- DEV MODE: new random OTP every time, overwrite previous, no rate limits -----
  if (isOtpDevMode()) {
    const trimmed = normalizePhoneDev(phone);
    if (!trimmed) {
      return { success: false, message: 'Phone number must be 10 digits', errorCode: OTP_ERROR_CODES.INVALID_PHONE };
    }
    const code = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);
    try {
      await withTimeout(
        Promise.all([
          Otp.deleteMany({ phone: trimmed }),
          Otp.create({ phone: trimmed, code, expiresAt }),
        ]),
        DB_TIMEOUT_MS
      );
    } catch (err) {
      console.warn('[auth] resendOtp DB failed (dev):', err?.message);
      return { success: false, message: 'Unable to store OTP. Please try again.', errorCode: OTP_ERROR_CODES.SMS_GATEWAY_ERROR };
    }
    console.log('[auth] DEV resend-otp for', trimmed, '→ OTP:', code);
    return { success: true, message: 'OTP sent successfully (dev mode)', otp: code };
  }

  // ----- PRODUCTION -----
  const trimmed = normalizePhone(phone);
  if (!trimmed) {
    return { success: false, message: 'Invalid phone number. Phone must be numeric only.', errorCode: OTP_ERROR_CODES.INVALID_PHONE };
  }

  const resendCheck = checkResendLimit(trimmed);
  if (!resendCheck.allowed) {
    return { success: false, message: resendCheck.message, errorCode: resendCheck.reason || OTP_ERROR_CODES.RATE_LIMIT };
  }

  const code = generateOtp();

  console.log('[auth] Resending SMS to', trimmed, 'via gateway...');
  const smsResult = await sendOtpSms(trimmed, code, 5);

  if (!smsResult.sent) {
    clearResendEntry(trimmed);
    console.warn('[auth] Resend SMS NOT sent. errorCode:', smsResult.errorCode || '-', '| userMessage:', smsResult.userMessage || '-');
    if (smsResult.internalLog) console.warn('[auth] SMS details:', smsResult.internalLog);
    return {
      success: false,
      message: smsResult.userMessage || 'SMS failed. Please check the number and try again.',
      errorCode: smsResult.errorCode || OTP_ERROR_CODES.SMS_GATEWAY_ERROR,
    };
  }

  try {
    await withTimeout(
      Promise.all([
        Otp.deleteMany({ phone: trimmed }),
        Otp.create({ phone: trimmed, code, expiresAt: new Date(Date.now() + OTP_TTL_MS) }),
      ]),
      DB_TIMEOUT_MS
    );
  } catch (err) {
    console.warn('[auth] resendOtp DB failed after SMS sent:', err?.message);
    return { success: false, message: 'OTP was sent but could not be stored. Please try again.', errorCode: OTP_ERROR_CODES.SMS_GATEWAY_ERROR };
  }
  recordSuccessfulSend(trimmed);
  return { success: true, message: 'OTP sent successfully' };
};

/**
 * Verify OTP: check wrong-attempt limit, find OTP, validate expiry, delete on success, return token.
 * DEV MODE: no attempt limit, no expiry blocking; match latest OTP only.
 */
const verifyOtp = async (phone, otp) => {
  if (phone === undefined || phone === null || otp === undefined || otp === null) {
    return { success: false, message: 'Phone and OTP are required' };
  }
  const otpStr = String(otp).trim();
  if (!otpStr || !/^\d{4}$/.test(otpStr)) {
    return { success: false, message: 'OTP must be exactly 4 numeric digits' };
  }

  // ----- DEV MODE: no attempt limit, no expiry check; match latest OTP only -----
  if (isOtpDevMode()) {
    const trimmed = normalizePhoneDev(phone);
    if (!trimmed) {
      return { success: false, message: 'Phone number must be 10 digits', errorCode: OTP_ERROR_CODES.INVALID_PHONE };
    }
    try {
      const record = await withTimeout(Otp.findOne({ phone: trimmed }), DB_TIMEOUT_MS);
      if (!record) {
        return { success: false, message: 'OTP not found. Please request a new OTP.', errorCode: OTP_ERROR_CODES.OTP_NOT_FOUND };
      }
      if (record.code !== otpStr) {
        return { success: false, message: 'Incorrect OTP. Please try again.', errorCode: OTP_ERROR_CODES.INCORRECT_OTP };
      }
      let user = await User.findOne({ phone: trimmed });
      if (!user) user = await User.create({ phone: trimmed });
      await Otp.deleteOne({ _id: record._id }).catch(() => {});
      const token = jwt.sign(
        { sub: user._id.toString(), userId: user._id.toString() },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      return { success: true, message: 'OTP verified', token, user: { phone: user.phone, id: user._id.toString() } };
    } catch (err) {
      console.warn('[auth] verifyOtp DB error (dev):', err?.message);
      return { success: false, message: 'Verification failed. Please try again.' };
    }
  }

  // ----- PRODUCTION: attempt limit, expiry check -----
  const trimmed = normalizePhone(phone);
  if (!trimmed) {
    return { success: false, message: 'Invalid phone number. Phone must be numeric only.', errorCode: OTP_ERROR_CODES.INVALID_PHONE };
  }

  const attemptCheck = checkWrongAttemptLimit(trimmed);
  if (!attemptCheck.allowed) {
    return { success: false, message: attemptCheck.message, errorCode: OTP_ERROR_CODES.TOO_MANY_ATTEMPTS };
  }

  try {
    const record = await withTimeout(Otp.findOne({ phone: trimmed }), DB_TIMEOUT_MS);
    if (!record) {
      return { success: false, message: 'OTP not found. Please request a new OTP.', errorCode: OTP_ERROR_CODES.OTP_NOT_FOUND };
    }
    if (new Date() > record.expiresAt) {
      await Otp.deleteOne({ _id: record._id }).catch(() => {});
      return { success: false, message: 'OTP expired. Please request a new OTP.', errorCode: OTP_ERROR_CODES.OTP_EXPIRED };
    }
    if (record.code !== otpStr) {
      recordWrongAttempt(trimmed);
      return { success: false, message: 'Incorrect OTP. Please try again.', errorCode: OTP_ERROR_CODES.INCORRECT_OTP };
    }
    let user = await User.findOne({ phone: trimmed });
    if (!user) user = await User.create({ phone: trimmed });
    await Otp.deleteOne({ _id: record._id }).catch(() => {});
    clearWrongAttempts(trimmed);
    const token = jwt.sign(
      { sub: user._id.toString(), userId: user._id.toString() },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    return { success: true, message: 'OTP verified', token, user: { phone: user.phone, id: user._id.toString() } };
  } catch (err) {
    console.warn('[auth] verifyOtp DB error:', err?.message);
    return { success: false, message: 'Verification failed. Please try again.' };
  }
};

module.exports = { sendOtp, resendOtp, verifyOtp };
