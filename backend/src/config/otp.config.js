/**
 * OTP config – loads OTP/SMS credentials from config file and env (no hardcoding).
 * Supports: config smsvendor (Spear UC / custom), MSG91, Fast2SMS, Twilio.
 * India DLT: use approved template ID in MSG91/Fast2SMS; config smsvendor may include t_id for DLT.
 * Default: backend/config.json (override via OTP_CONFIG_PATH). Restart backend after config changes.
 */
const path = require('path');
const fs = require('fs');

let cached = null;

function getConfigPath() {
  if (process.env.OTP_CONFIG_PATH) {
    return path.isAbsolute(process.env.OTP_CONFIG_PATH)
      ? process.env.OTP_CONFIG_PATH
      : path.resolve(process.cwd(), process.env.OTP_CONFIG_PATH);
  }
  return path.resolve(__dirname, '../../config.json');
}

/**
 * Load OTP-related config from file. Returns smsvendor, smsProvider, Twilio keys, smsCountryCode, smsPrependCountryCode, debugMode.
 * Twilio credentials: env (TWILIO_ACCOUNT_SID etc.) override config (twilioAccountSid etc.).
 */
function loadOtpConfig() {
  if (cached !== null) return cached;
  const configPath = getConfigPath();
  try {
    const raw = fs.readFileSync(configPath, 'utf8');
    const data = JSON.parse(raw);
    const smsProviderRaw = (typeof data.smsProvider === 'string' ? data.smsProvider.trim() : '') || (data.enableTwilio === true || data.enableTwilio === 1 ? 'twilio' : '') || (data.useTwilio === true || data.useTwilio === 1 ? 'twilio' : '');
    // DEV mode: no real SMS, use fixed OTP (e.g. 1234). Set via config.otpDevMode=1 or OTP_DEV_MODE=1 or NODE_ENV=development.
    const otpDevModeConfig = data.otpDevMode === 1 || data.otpDevMode === true;
    const otpDevModeEnv = process.env.OTP_DEV_MODE === '1' || process.env.OTP_DEV_MODE === 'true';
    const otpDevMode = otpDevModeConfig || otpDevModeEnv || process.env.NODE_ENV === 'development';

    cached = {
      smsvendor: typeof data.smsvendor === 'string' ? data.smsvendor.trim() : '',
      smsProvider: smsProviderRaw.toLowerCase() === 'twilio' ? 'twilio' : (smsProviderRaw.toLowerCase() === 'config' || smsProviderRaw === '' ? 'config' : smsProviderRaw),
      smsParamMobile: typeof data.smsParamMobile === 'string' ? data.smsParamMobile.trim() : 'mobile',
      smsParamMessage: typeof data.smsParamMessage === 'string' ? data.smsParamMessage.trim() : 'message',
      smsCountryCode: typeof data.smsCountryCode === 'string' ? data.smsCountryCode.trim() : '91',
      smsPrependCountryCode: data.smsPrependCountryCode === true || data.smsPrependCountryCode === 1,
      smsMethod: (typeof data.smsMethod === 'string' ? data.smsMethod.toUpperCase() : '') === 'POST' ? 'POST' : 'GET',
      debugMode: data.debugMode === 1 || data.debugMode === true,
      otpDevMode,
      twilioAccountSid: typeof data.twilioAccountSid === 'string' ? data.twilioAccountSid.trim() : '',
      twilioAuthToken: typeof data.twilioAuthToken === 'string' ? data.twilioAuthToken.trim() : '',
      twilioPhoneNumber: typeof data.twilioPhoneNumber === 'string' ? data.twilioPhoneNumber.trim() : '',
      msg91AuthKey: (typeof data.msg91AuthKey === 'string' ? data.msg91AuthKey.trim() : '') || (process.env.MSG91_AUTH_KEY || '').trim(),
      msg91Sender: (typeof data.msg91Sender === 'string' ? data.msg91Sender.trim() : '') || (process.env.MSG91_SENDER || '').trim(),
      msg91TemplateId: (typeof data.msg91TemplateId === 'string' ? data.msg91TemplateId.trim() : '') || (process.env.MSG91_TEMPLATE_ID || '').trim(),
      /** Optional: DLT-approved message template. Use {otp} placeholder. If set, this is used instead of default message so SMS is not dropped by DLT. */
      smsMessageTemplate: typeof data.smsMessageTemplate === 'string' ? data.smsMessageTemplate.trim() : '',
    };
    const hasVendor = !!cached.smsvendor;
    console.log('[OTP config] Loaded from', configPath, '| smsProvider:', cached.smsProvider, '| smsvendor:', hasVendor ? 'set' : 'not set', '| countryCode:', cached.smsCountryCode, '| otpDevMode:', cached.otpDevMode, '| debugMode:', cached.debugMode);
  } catch (err) {
    console.warn('[OTP config] Failed to load', configPath, ':', err?.message);
    cached = { smsvendor: '', smsProvider: 'config', smsParamMobile: 'mobile', smsParamMessage: 'message', smsCountryCode: '91', smsPrependCountryCode: false, smsMethod: 'GET', debugMode: false, otpDevMode: process.env.NODE_ENV === 'development', twilioAccountSid: '', twilioAuthToken: '', twilioPhoneNumber: '', msg91AuthKey: '', msg91Sender: '', msg91TemplateId: '', smsMessageTemplate: '' };
  }
  return cached;
}

/**
 * Get SMS vendor base URL (with query params). Empty if not configured.
 */
function getSmsVendorUrl() {
  return loadOtpConfig().smsvendor || '';
}

/**
 * Get active SMS provider: 'twilio' | 'config'. Twilio is used when smsProvider === 'twilio'.
 */
function getSmsProvider() {
  return loadOtpConfig().smsProvider || 'config';
}

/**
 * Get Twilio config. Env (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER) overrides config.json.
 */
function getTwilioConfig() {
  const c = loadOtpConfig();
  return {
    accountSid: (process.env.TWILIO_ACCOUNT_SID || c.twilioAccountSid || '').trim(),
    authToken: (process.env.TWILIO_AUTH_TOKEN || c.twilioAuthToken || '').trim(),
    phoneNumber: (process.env.TWILIO_PHONE_NUMBER || c.twilioPhoneNumber || '').trim(),
  };
}

/**
 * Get SMS vendor param names and country code for building request.
 * Param names are read-only from config (no guessing in code).
 * smsPrependCountryCode: false = send 10 digits only; true = prepend countryCode (e.g. 91).
 *
 * Optional config keys (fix gateway "number required" by matching API contract):
 *   smsParamMobile   – e.g. "mobileno" (Spear UC), default "mobile"
 *   smsParamMessage  – e.g. "msg" (Spear UC), default "message"
 */
function getSmsVendorParams() {
  const c = loadOtpConfig();
  return {
    paramMobile: c.smsParamMobile || 'mobile',
    paramMessage: c.smsParamMessage || 'message',
    countryCode: c.smsCountryCode || '91',
    prependCountryCode: c.smsPrependCountryCode === true,
    method: c.smsMethod === 'POST' ? 'POST' : 'GET',
  };
}

/** Optional DLT-approved SMS message. Use {otp} in the string; replaced at send time. If empty, default message is used. */
function getSmsMessageTemplate() {
  return loadOtpConfig().smsMessageTemplate || '';
}

/** DEV mode: do not send real SMS; use fixed OTP and log to console. PROD: send real SMS only. */
function isOtpDevMode() {
  return loadOtpConfig().otpDevMode === true;
}

/** MSG91 (India) – auth key, sender ID, DLT template ID. Env: MSG91_AUTH_KEY, MSG91_SENDER, MSG91_TEMPLATE_ID. */
function getMsg91Config() {
  const c = loadOtpConfig();
  return {
    authKey: c.msg91AuthKey || (process.env.MSG91_AUTH_KEY || '').trim(),
    sender: c.msg91Sender || (process.env.MSG91_SENDER || '').trim(),
    templateId: c.msg91TemplateId || (process.env.MSG91_TEMPLATE_ID || '').trim(),
  };
}

module.exports = {
  loadOtpConfig,
  getSmsVendorUrl,
  getSmsVendorParams,
  getSmsMessageTemplate,
  getSmsProvider,
  getTwilioConfig,
  isOtpDevMode,
  getMsg91Config,
};
